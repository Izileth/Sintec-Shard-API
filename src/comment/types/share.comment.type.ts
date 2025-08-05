
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ShareType } from 'generated/prisma';

export class ShareCommentDto {
  @IsEnum(ShareType)
  shareType: ShareType;

  @IsOptional()
  @IsString()
  platform?: string; // Facebook, Twitter, WhatsApp, etc.
}
