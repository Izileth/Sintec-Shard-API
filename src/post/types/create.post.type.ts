import { IsString, IsOptional, IsBoolean, IsArray, IsInt } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreatePostDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  excerpt?: string;

  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  published?: boolean = false;

  // IDs de categorias existentes
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  @Type(() => Number)
  categoryIds?: number[];

  // IDs de tags existentes
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  @Type(() => Number)
  tagIds?: number[];

  // Nomes de novas categorias para criar
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  newCategories?: string[];

  // Nomes de novas tags para criar
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  newTags?: string[];
}
