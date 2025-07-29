import {  IsString, IsOptional } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsOptional() // Pode vir do cookie ou do body
  refreshToken?: string;
}