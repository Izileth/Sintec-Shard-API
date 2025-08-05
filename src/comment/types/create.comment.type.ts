
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000, { message: 'Comentário não pode exceder 2000 caracteres' })
  content: string;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  postId: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  parentId?: number; // Para respostas a outros comentários
}

