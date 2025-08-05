
import { IsOptional, IsInt, IsString, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CommentQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @IsIn(['newest', 'oldest', 'popular', 'controversial'])
  sortBy?: string = 'newest';

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  parentId?: number; // Para buscar apenas respostas de um comentário específico
}
