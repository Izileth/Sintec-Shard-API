
import { IsString, IsOptional, IsBoolean, IsDateString, MaxLength, MinLength } from 'class-validator';

export class BanUserDto {
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason: string;

  @IsOptional()
  @IsBoolean()
  isPermanent?: boolean = false;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}