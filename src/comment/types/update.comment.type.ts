
import { PartialType } from '@nestjs/mapped-types';
import { CreateCommentDto } from './create.comment.type';

export class UpdateCommentDto extends PartialType(CreateCommentDto) {}

