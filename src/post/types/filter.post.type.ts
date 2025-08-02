import { IsString, IsOptional, IsBoolean, IsArray, IsInt } from 'class-validator';
import { Transform, Type } from 'class-transformer';


export class PostFilterDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  categoryId?: number;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  @Type(() => Number)
  tagIds?: number[];

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  published?: boolean;

  @IsString()
  @IsOptional()
  authorUsername?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @IsString()
  @IsOptional()
  sortBy?: 'createdAt' | 'updatedAt' | 'title' = 'createdAt';

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}