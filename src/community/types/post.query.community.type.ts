import { IsOptional, IsString, IsNumber, Min, Max, IsIn, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PostType } from './post.community.type';
export class CommunityPostQueryDto {
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
  @IsIn(['hot', 'new', 'top', 'controversial'])
  sort?: string = 'hot';

  @IsOptional()
  @IsIn(['hour', 'day', 'week', 'month', 'year', 'all'])
  time?: string = 'all';

  @IsOptional()
  @IsEnum(PostType)
  type?: PostType;

  @IsOptional()
  @IsIn(['approved', 'pending', 'all'])
  status?: string = 'approved';
}
