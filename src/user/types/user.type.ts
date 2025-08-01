
import {
  IsEmail,
  IsOptional,
  IsString,
  IsEnum,
  IsUrl,
  IsDateString,
  MinLength,
} from 'class-validator';
import { Role } from 'generated/prisma';

export class UserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  location?: string;

  // Senha em texto puro para ser hasheada no service
  @IsString()
  @MinLength(6)
  password: string;
}
