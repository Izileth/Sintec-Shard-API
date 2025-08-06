
import { PartialType } from '@nestjs/mapped-types';
import { CreateCommunityDto } from './create.community.type';

export class UpdateCommunityDto extends PartialType(CreateCommunityDto) {}
