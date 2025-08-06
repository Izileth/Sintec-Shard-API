
import { IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class AddModeratorDto {
  @IsNumber()
  userId: number;

  @IsOptional()
  @IsBoolean()
  canModerate?: boolean = true;

  @IsOptional()
  @IsBoolean()
  canBan?: boolean = false;

  @IsOptional()
  @IsBoolean()
  canInvite?: boolean = false;

  @IsOptional()
  @IsBoolean()
  canEdit?: boolean = false;
}
