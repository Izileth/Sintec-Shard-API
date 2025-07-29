import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ResendModule } from "src/resend/resend.module";
import { PrismaService } from "src/prisma/prisma.service";
import { JwtStrategy } from "src/strategies/privare.jwt.strategies";
@Module({
    imports: [
        JwtModule.registerAsync({
        imports: [ConfigModule],
        useFactory: async (config: ConfigService) => ({
            secret: config.get<string>('JWT_SECRET'),
            signOptions: { expiresIn: config.get<string>('JWT_EXPIRATION') }
        }),
        inject: [ConfigService]
        }),
        ConfigModule.forRoot({ isGlobal: true }), 
        ResendModule
    ],
    controllers: [
        AuthController,
    ],
    providers: [AuthService, PrismaService, JwtStrategy]
})
export class AuthModule {}
