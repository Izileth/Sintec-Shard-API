
import { IsString, IsOptional, IsEnum, MaxLength, MinLength, IsUrl } from 'class-validator';

export enum PostType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  LINK = 'LINK',
  POLL = 'POLL'
}


export class CreateCommunityPostDto {
  @IsString()
  @MinLength(5)
  @MaxLength(300)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  content?: string;

  @IsEnum(PostType)
  type: PostType = PostType.TEXT;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @IsOptional()
  @IsUrl()
  linkUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  linkTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkDescription?: string;
}