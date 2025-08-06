
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class JoinCommunityDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string; // Para comunidades que requerem aprovação
}