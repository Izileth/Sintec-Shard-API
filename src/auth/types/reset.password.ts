import { IsString, IsNotEmpty, MinLength, ValidateIf, Length, IsOptional } from 'class-validator';

export class ResetPasswordDto {
  @ValidateIf(o => !o.code) // Valida apenas se 'code' não estiver presente
  @IsString()
  token?: string;

  @ValidateIf(o => !o.token) // Valida apenas se 'token' não estiver presente
  @IsString()
  @Length(6, 6)
  code?: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
    
      
  @IsOptional() 
  @IsString()
  email?: string; // Necessário para o fluxo com código

  @IsOptional()
  @IsString()
  currentPassword?: string; // Para alteração dentro do app  
}