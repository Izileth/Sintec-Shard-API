
import { Module } from '@nestjs/common';
import { PostsService } from './post.service';
import { PostController } from './post.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryModule } from 'src/cloudnary/cloudnary.module';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [PrismaModule, CloudinaryModule, JwtModule.register({})],
  controllers: [PostController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostModule {}