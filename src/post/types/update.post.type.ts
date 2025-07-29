import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create.post.type';
export class UpdatePostDto extends PartialType(CreatePostDto) {}
