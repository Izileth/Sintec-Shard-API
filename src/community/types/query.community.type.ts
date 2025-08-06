
import { IsOptional, IsString, IsNumber, Min, Max, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CommunityQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsIn(['name', 'membersCount', 'postsCount', 'createdAt'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  privateOnly?: boolean;

  @IsOptional()
  @IsString()
  prefix?: string;
}