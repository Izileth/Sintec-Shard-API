import { Delete, Get, Post, Put } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { CategoryService } from './category.service';
@Controller('category')
export class CategoryController {
    constructor(private categoryService: CategoryService) {}

    @Get('/entire')
    getCategory() {}

    @Post('/create')
    createCategory() {}

    @Put('/update')
    updateCategory() {}

    @Delete('/delete')
    deleteCategory() {}

}
