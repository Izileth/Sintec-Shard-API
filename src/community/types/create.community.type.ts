
import { IsString, IsOptional, IsBoolean, MaxLength, MinLength, Matches, IsHexColor } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCommunityDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Nome pode conter apenas letras, números e underscore' })
  @Transform(({ value }) => value?.toLowerCase())
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10)
  prefix: string;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  displayName: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  rules?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean = false;

  @IsOptional()
  @IsBoolean()
  requireApproval?: boolean = false;

  @IsOptional()
  @IsBoolean()
  allowImages?: boolean = true;

  @IsOptional()
  @IsBoolean()
  allowVideos?: boolean = true;

  @IsOptional()
  @IsBoolean()
  allowPolls?: boolean = true;
}