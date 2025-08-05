
import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ReportReason } from 'generated/prisma';

export class ReportCommentDto {
  @IsEnum(ReportReason)
  reason: ReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}