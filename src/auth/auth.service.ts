import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import {
  LoginDto,
  CreateUserDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './types';

import {  Res } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

import { ResendService } from 'src/resend/resend.service';

import { v4 as uuidv4 } from 'uuid';

import { RequestWithCookies } from 'src/interfaces/request.cookies.interface';
import { RefreshTokenDto } from './types/refresh.token.type';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private readonly resendService: ResendService,
  ) {}

  async signUp(dto: CreateUserDto) {
    const hash = await argon.hash(dto.password);

    try {
      // ✅ CORREÇÃO: Converter birthDate para DateTime se fornecido
      let birthDate: Date | undefined;
      if (dto.birthDate) {
        try {
          // Converte string de data para DateTime
          birthDate = new Date(dto.birthDate);
          
          // Verifica se a data é válida
          if (isNaN(birthDate.getTime())) {
            throw new BadRequestException('Data de nascimento inválida');
          }
          
          // Opcional: Validar se a data não é futura
          if (birthDate > new Date()) {
            throw new BadRequestException('Data de nascimento não pode ser futura');
          }
        } catch (error) {
          throw new BadRequestException('Formato de data inválido. Use YYYY-MM-DD');
        }
      }

      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          username: dto.username,
          bio: dto.bio,
          avatarUrl: dto.avatarUrl,
          website: dto.website,
          location: dto.location,
          birthDate: birthDate, 
          email: dto.email,
          passwordHash: hash,
          role: dto.role, 
        },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          username: true,
          bio: true,
          avatarUrl: true,
          website: true,
          location: true,
          birthDate: true,
          createdAt: true,
        },
      });
      return user;
    } catch (error) {
      // Log completo do erro para debug
      console.error('Erro completo ao criar usuário:', {
        message: error.message,
        code: error.code,
        meta: error.meta,
        stack: error.stack
      });

      // ✅ CORREÇÃO: Verificar error.code ao invés de error
      if (error.code === 'P2002') {
        // Verificar qual campo está duplicado
        const field = error.meta?.target?.[0] || 'campo';
        throw new ForbiddenException(`${field} já está em uso`);
      }
      
      // Outros erros específicos do Prisma
      if (error.code === 'P2000') {
        throw new BadRequestException('Dados fornecidos são muito longos');
      }
      
      if (error.code === 'P2001') {
        throw new NotFoundException('Registro não encontrado');
      }

      // Se for erro de validação do Prisma
      if (error.name === 'PrismaClientValidationError') {
        throw new BadRequestException('Dados inválidos fornecidos');
      }

      // Se for erro de BadRequestException que lançamos, repassar
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Erro genérico
      throw new InternalServerErrorException('Erro interno ao criar usuário');
    }
  }

  // Login
  async signIn(dto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const pwMatches = await argon.verify(user.passwordHash, dto.password);
    if (!pwMatches) throw new ForbiddenException('Credencial Incorreta!');

    // Gerar um novo reset code para o usuário
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetCode,
        resetCodeExpires,
        resetToken: null,
        resetTokenExpires: null,
        isActive: true,
      },
    });

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
    );

    // Configurações consistentes de cookie
    const cookieOptions = {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };

    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutos
    });

    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      path: '/auth/refresh',
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      reset_code: resetCode,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        username: user.username,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        website: user.website,
        location: user.location,
        birthDate: user.birthDate,
        createdAt: user.createdAt,
      },
    };
  }

  // Logout
  async signOut(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/auth/refresh' });
    return {
      message: 'Logout realizado com sucesso',
    };
  }
  async forgotPassword(dto: ForgotPasswordDto) {
    const requestId = uuidv4().substring(0, 8);
    
    const response = {
      message: 'Solicitação de recuperação processada com sucesso.',
      success: true,
      status: 'processing',
      data: {
        requestId,
        estimatedTime: '5-10 minutos',
        instructions: [
          'Verifique sua caixa de entrada',
          'Verifique a pasta de spam',
          'O link expira em 2 horas'
        ]
      },
      timestamp: new Date().toISOString()
    };

    // Processar em background
    this.processForgotPasswordInBackground(dto.email).catch(error => {
      console.error(`[${requestId}] Erro no envio de email:`, error);
    });

    return response;
  }

  private async processForgotPasswordInBackground(email: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.isActive) {
        return; // Não fazer nada se usuário não existir ou não estiver ativo
      }

      const resetToken = uuidv4();
      const resetTokenExpires = new Date(Date.now() + 2 * 60 * 60 * 1000);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpires,
        },
      });

      const resetLink = `${this.config.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;

      await this.resendService.sendPasswordResetEmail(
        user.email,
        user.name || 'Usuário',
        resetLink,
      );

      console.log(`Email de recuperação enviado para: ${user.email}`);
    } catch (error) {
      console.error('Erro no processamento de recuperação de senha:', error);
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    const whereCondition = dto.token
      ? {
          resetToken: dto.token,
          resetTokenExpires: {
            gt: new Date(),
          },
        }
      : {
          resetCode: dto.code,
          resetCodeExpires: {
            gt: new Date(),
          },
        };

    const user = await this.prisma.user.findFirst({
      where: whereCondition,
    });

    if (!user) throw new NotFoundException('Token/código inválido ou expirado');

    const hash = await argon.hash(dto.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hash,
        resetToken: null,
        resetTokenExpires: null,
        resetCode: null,
        resetCodeExpires: null,
      },
    });

    return {
      message: 'Senha redefinida com sucesso',
    };
  }

  async generatePasswordResetToken(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const resetToken = uuidv4();
    const resetTokenExpires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 horas

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires,
      },
    });

    return { token: resetToken };
  }

  async generateResetCode(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetCode,
        resetCodeExpires,
        resetToken: null, // Limpa token anterior
        resetTokenExpires: null,
      },
    });

    return { code: resetCode };
  }

  private async generateTokens(userId: number, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, email },
        {
          secret: this.config.get('JWT_SECRET'),
          expiresIn: '15m', // Access token curto
        },
      ),
      this.jwt.signAsync(
        { sub: userId },
        {
          secret: this.config.get('JWT_REFRESH_SECRET'),
          expiresIn: '7d', // Refresh token longo
        },
      ),
    ]);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken,
        refreshTokenExp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  async refreshTokens(
    req: RequestWithCookies,
    res: Response,
    body: RefreshTokenDto,
  ) {
    const refreshToken = req.cookies?.refresh_token || body.refreshToken;

    if (!refreshToken) {
      throw new ForbiddenException('Refresh token não encontrado');
    }

    try {
      const payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      // Validar se payload.sub é um número válido
      const userId = parseInt(payload.sub);
      if (isNaN(userId)) {
        throw new ForbiddenException('Token inválido');
      }

      const user = await this.prisma.user.findFirst({
        where: {
          id: userId,
          refreshToken,
          refreshTokenExp: {
            gt: new Date(),
          },
        },
      });

      if (!user) {
        throw new ForbiddenException('Refresh token inválido');
      }

      const { accessToken, refreshToken: newRefreshToken } =
        await this.generateTokens(user.id, user.email);

      // Configurações consistentes de cookie
      const cookieOptions = {
        httpOnly: true,
        secure: this.config.get('NODE_ENV') === 'production',
        sameSite: 'strict' as const,
      };

      res.cookie('access_token', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 minutos
        path: '/',
      });

      res.cookie('refresh_token', newRefreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
        path: '/auth/refresh',
      });

      return { access_token: accessToken };
    } catch (error) {
      throw new ForbiddenException('Refresh token inválido');
    }
  }
}