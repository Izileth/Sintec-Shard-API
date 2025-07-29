

import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsInt()
  postId: number;

  @IsOptional()
  @IsInt()
  authorId?: number;
}

