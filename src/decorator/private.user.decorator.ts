import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { User } from 'generated/prisma';

export const GetUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (data) {
      if (!request.user[data]) {
        throw new UnauthorizedException(`User data ${String(data)} not found`);
      }
      return request.user[data];
    }
    
    return request.user;
  }
);