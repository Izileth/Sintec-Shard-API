import { 
    Body, 
    Controller, 
    Delete, 
    Get, 
    HttpCode, 
    HttpStatus, 
    Param, 
    ParseIntPipe,  
    Post, 
    Put, 
    UseGuards,
    Query,
    UseInterceptors,
    UploadedFile,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetUser } from 'src/decorator/private.user.decorator';
import { CreatePostDto, UpdatePostDto, PostFilterDto } from './types';
import { JwtGuard } from 'src/guards/private.jwt.guard';
import { CloudinaryInterceptor } from 'src/interceptors/cloudnary.interceptos';
import { Public } from 'src/decorator/public.jwt.decorator';
import { PostsService } from './post.service';

@UseGuards(JwtGuard)
@Controller('posts')
export class PostController {

    constructor(private postsService: PostsService) {}

    @Public()
    @Get()
    async getAllPosts(
        @Query() filters: PostFilterDto,
        @GetUser('id') userId?: number
    ) {
        return this.postsService.getAllPosts(filters, userId);
    }

    @Get('user/favorites')
    async getFavorites(
        @GetUser('id') userId: number,
        @Query() filters: PostFilterDto
    ) {
        return this.postsService.getFavoritesByUser(userId, filters);
    }

    @Get('user/:username')
    async getPostsByUsername(
        @Param('username') username: string,
        @GetUser('id') userId?: number
    ) {
        return this.postsService.getPostByUsername(username, userId);
    }

    @Get('/user/posts')
    async getMyPosts(
        @GetUser('id') userId: number
    ) {
        return this.postsService.getPostsByUser(userId, userId);
    }
    
    @Public()
    @Get(':id')
    async getPostById(
        @Param('id', ParseIntPipe) postId: number,
        @GetUser('id') userId?: number
    ) {
        return this.postsService.getPostById(postId, userId);
    }

    @Post()
    @UseInterceptors(
        FileInterceptor('image', {
            limits: { fileSize: 1024 * 1024 * 5 } // 5MB
        }),
        CloudinaryInterceptor
    )
    async createPost(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 5000000 }),
                    new FileTypeValidator({ fileType: 'image/*' }),
                ],
                fileIsRequired: false
            })
        ) file: Express.Multer.File,
        @GetUser('id') userId: number,
        @Body() dto: CreatePostDto,
    ) {
        // Se um arquivo foi enviado, adicionar a URL ao DTO
        if (file && file.path) {
            dto.coverImageUrl = file.path;
        }

        return this.postsService.createPost(userId, dto);
    }

    @Put(':id')
    @UseInterceptors(
        FileInterceptor('image', {
            limits: { fileSize: 1024 * 1024 * 5 } // 5MB
        }),
        CloudinaryInterceptor
    )
    async editPostById(
        @GetUser('id') userId: number,
        @Param('id', ParseIntPipe) postId: number,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 5000000 }),
                    new FileTypeValidator({ fileType: 'image/*' }),
                ],
                fileIsRequired: false
            })
        ) file: Express.Multer.File,
        @Body() dto: UpdatePostDto,
    ) {
        // Se um novo arquivo foi enviado, adicionar a URL ao DTO
        if (file && file.path) {
            dto.coverImageUrl = file.path;
        }

        return this.postsService.editPostById(userId, postId, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deletePostById(
        @GetUser('id') userId: number,
        @Param('id', ParseIntPipe) postId: number,
    ) {
        return this.postsService.deletePostById(userId, postId);
    }

    @Post(':id/favorite')
    @HttpCode(HttpStatus.OK)
    async toggleFavorite(
        @GetUser('id') userId: number,
        @Param('id', ParseIntPipe) postId: number
    ) {
        return this.postsService.toggleFavorite(userId, postId);
    }
}