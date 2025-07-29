import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtPayload } from "src/auth/types/submit.token";
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(
    Strategy,
    'jwt'
    ) {
    constructor(config: ConfigService,private prisma: PrismaService) {
        super({
        jwtFromRequest: ExtractJwt.fromExtractors([
            (request) => {
            return (
                request?.cookies?.access_token ||
                request?.headers?.authorization?.split(' ')[1]
            );
            },
        ]),
        ignoreExpiration: false,
        secretOrKey: config.get('JWT_SECRET') as string, 
        });
    }

    async validate(payload: JwtPayload) {
        const user = await this.prisma.user.findUnique({
            where: { id: parseInt(payload.sub)},
            select: { 
            id: true,
            email: true,
            isActive: true,
            role: true 
            }
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('User account is disabled');
        }

        return user;
    }
}