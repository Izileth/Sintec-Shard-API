import { Delete, Get, Post, Put } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { PostService } from './post.service';
@Controller('post')
export class PostController {
    constructor(private postService: PostService) {}

    @Get('/entire')
    getPosts() {}

    @Get('/:id')
    getPostById() {}

    @Post()
    createPost() {}

    @Put('/:id')
    updatePost() {}

    @Delete('/:id')
    deletePost() {}

    @Post('/:id/like')
    likePost() {}
    
    @Post('/:id/dislike')
    dislikePost() {}
    
}
