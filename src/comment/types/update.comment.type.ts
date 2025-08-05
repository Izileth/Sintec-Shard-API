import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000, { message: 'Comentário não pode exceder 2000 caracteres' })
  content: string;
}
