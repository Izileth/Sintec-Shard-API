
import { PartialType } from '@nestjs/mapped-types';
import { CreateTagDto } from './create.tag.type';

export class UpdateTagDto extends PartialType(CreateTagDto) {}
