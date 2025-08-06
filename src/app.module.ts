import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { PostModule } from './post/post.module';
import { CategoryModule } from './category/category.module';
import { UserModule } from './user/user.module';
import { CommentModule } from './comment/comment.module';
import { TagsModule } from './tags/tags.module';
import { JwtModule } from '@nestjs/jwt';
import { CloudinaryModule } from './cloudnary/cloudnary.module';
import { CommunityModule } from './community/community.module';
@Module({
  imports: [AuthModule, PrismaModule, PostModule, CategoryModule, UserModule, CommentModule, TagsModule, JwtModule, CloudinaryModule, CommunityModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
