import { PartialType } from '@nestjs/mapped-types';
import { CreateCommunityPostDto } from './post.community.type';

export class UpdateCommunityPostDto extends PartialType(CreateCommunityPostDto) {}
