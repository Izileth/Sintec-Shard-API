
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateModeratorDto {
  @IsOptional()
  @IsBoolean()
  canModerate?: boolean;

  @IsOptional()
  @IsBoolean()
  canBan?: boolean;

  @IsOptional()
  @IsBoolean()
  canInvite?: boolean;

  @IsOptional()
  @IsBoolean()
  canEdit?: boolean;
}