import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtService } from '@nestjs/jwt';
@Module({
  imports: [JwtModule],
  controllers: [CommunityController],
  providers: [CommunityService, JwtService ]
})

export class CommunityModule {}