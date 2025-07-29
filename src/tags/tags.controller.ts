import { Get, Post, Put, Delete } from '@nestjs/common';
import { TagsService } from './tags.service';
import { Controller } from '@nestjs/common';

@Controller('tags')
export class TagsController {
    constructor(private tagsService: TagsService) {}

    @Get('/entire')
    getTags() {}

    @Get('/:id')
    getTagById() {}

    @Post()
    createTag() {}

    @Put('/:id')
    updateTag() {}

    @Delete('/:id')
    deleteTag() {}

}
