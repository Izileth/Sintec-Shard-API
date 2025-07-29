import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create.category.type';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
