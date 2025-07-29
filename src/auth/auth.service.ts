import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  LoginDto,
  CreateUserDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './types';

import { Req, Res } from '@nestjs/common';
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
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          username: dto.username,
          bio: dto.bio,
          avatarUrl: dto.avatarUrl,
          website: dto.website,
          location: dto.location,
          birthDate: dto.birthDate,
          email: dto.email,
          passwordHash: hash,
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
      return user;
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(error);
        throw new ForbiddenException('Email already in use');
      }
      throw new InternalServerErrorException('Erro ao criar usuário');
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
      user.id.toString(),
      user.email,
    );

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutos
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'strict',
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
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return {
      message: 'Logout realizado com sucesso',
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return {
        message: 'Se o email existir, um link de recuperação será enviado',
      };
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

    return {
      message: 'Link de recuperação enviado para seu email',
    };
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

  private async generateTokens(userId: string, email: string) {
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
      where: { id: parseInt(userId) },
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

    const payload = await this.jwt.verifyAsync(refreshToken, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
    });

    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
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
      await this.generateTokens(user.id.toString(), user.email);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      maxAge: 15 * 60 * 1000, // 15 minutos
    });

    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      path: '/auth/refresh',
    });

    return { access_token: accessToken };
  }
}
