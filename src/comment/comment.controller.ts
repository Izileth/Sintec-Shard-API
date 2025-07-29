import { Delete, Get, Post, Put } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { CommentService } from './comment.service';
@Controller('comment')
export class CommentController {
    constructor(private commentService: CommentService) {} 
    
    @Get('/entire')
    getComments() {}

    @Get('/:id')
    getCommentById() {}
    @Post('/create')
    createComment() {}
    
    @Put('/:id/update')
    updateComment() {}
    
    @Delete('/:id/delete')
    deleteComment() {}

}
