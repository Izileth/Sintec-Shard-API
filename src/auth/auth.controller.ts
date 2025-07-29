import { HttpCode, HttpStatus } from '@nestjs/common';
import { Req, Res, UsePipes, ValidationPipe } from '@nestjs/common';
import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, CreateUserDto, RefreshTokenDto, ResetPasswordDto , ForgotPasswordDto } from './types';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
import { Response } from 'express';
import { RequestWithCookies } from 'src/interfaces/request.cookies.interface';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private config: ConfigService,
    ) {}
    
    @HttpCode(HttpStatus.CREATED)
    @Post('/signup')
    @UsePipes(
        new ValidationPipe({ whitelist: true }),
    ) 
    signUp(@Body() dto: CreateUserDto) {
        return this.authService.signUp(dto);
    }


    @HttpCode(HttpStatus.ACCEPTED)
    @Post('/signin')
    async signIn(
        @Body() dto: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        return this.authService.signIn(dto, res);
    }

    @HttpCode(HttpStatus.OK)
    @Post('/signout')
    signOut(
        @Res({ passthrough: true }) res: Response,
    ) {
        return this.authService.signOut(res)
    }
  

    @HttpCode(HttpStatus.PROCESSING)
    @Post('forgot-password')
    async forgotPassword(
        @Body() dto: ForgotPasswordDto,
    ) {
        return this.authService.forgotPassword(
            dto,
        );
    }

    @HttpCode(HttpStatus.ACCEPTED)
    @Post('reset-password')
    async resetPassword(
        @Body() dto: ResetPasswordDto,
    ) {
        return this.authService.resetPassword(
            dto,
        );
    }

    @HttpCode(HttpStatus.OK)
    @Post('forgot-password-test') // Rota específica para testes
    async forgotPasswordTest(
        @Body() dto: ForgotPasswordDto,
    ) {
        if (
            this.config.get('NODE_ENV') !==
            'development'
        ) {
            throw new ForbiddenException(
                'Esta rota só está disponível em desenvolvimento',
            );
        }

        const { token } =
            await this.authService.generatePasswordResetToken(
                dto.email,
            );
        return {
            message:
                'Token de redefinição (APENAS PARA TESTES)',
            token, // Token retornado diretamente (não fazer isso em produção!)
            resetLink: `${this.config.get('FRONTEND_URL')}/reset-password?token=${token}`,
        };
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(
        @Req() req: RequestWithCookies,
        @Res({ passthrough: true }) res: Response,
        @Body() body: RefreshTokenDto,
    ) {
        return this.authService.refreshTokens(
            req,
            res,
            body,
        );
    }
}
