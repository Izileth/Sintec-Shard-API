import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { JwtService } from '@nestjs/jwt';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
@Module({
  imports: [PrismaModule, JwtModule.register({})],
  providers: [CommentService, JwtService],
  controllers: [CommentController],
})
export class CommentModule {}
