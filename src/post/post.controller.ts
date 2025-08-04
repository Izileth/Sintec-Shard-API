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
    FileTypeValidator,
    Req
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetUser } from 'src/decorator/private.user.decorator';
import { CreatePostDto, UpdatePostDto, PostFilterDto } from './types';
import { JwtGuard } from 'src/guards/private.jwt.guard';
import { CloudinaryInterceptor } from 'src/interceptors/cloudnary.interceptos';
import { PostsService } from './post.service';
import { OptionalJwtGuard } from 'src/guards/opitional.jwt,guard';
import { RequestWithUser } from 'src/interfaces/request.user.iterface';
@Controller('posts')
export class PostController {

    constructor(private postsService: PostsService) {}

    // Rota completamente pública - sem guard
    @UseGuards(OptionalJwtGuard)
    @Get()
    async getAllPosts(
        @Query() filters: PostFilterDto,
        @Req() req: RequestWithUser
    ) {
        // Extrair userId do request se existir (usuário logado opcional)
        const userId = req.user?.id || undefined;
        return this.postsService.getAllPosts(filters, userId);
    }

    // Rota protegida - requer autenticação
    @UseGuards(JwtGuard)
    @Get('user/favorites')
    async getFavorites(
        @GetUser('id') userId: number,
        @Query() filters: PostFilterDto
    ) {
        return this.postsService.getFavoritesByUser(userId, filters);
    }

    // Rota pública com autenticação opcional
    @Get('user/:username')
    async getPostsByUsername(
        @Param('username') username: string,
        @Req() req: RequestWithUser,
    ) {
        const userId = req.user?.id || undefined;
        return this.postsService.getPostByUsername(username, userId);
    }

    // Rota protegida - requer autenticação
    @UseGuards(JwtGuard)
    @Get('/user/posts')
    async getMyPosts(
        @GetUser('id') userId: number
    ) {
        return this.postsService.getPostsByUser(userId, userId);
    }
    
    // Rota completamente pública - sem guard
    @UseGuards(OptionalJwtGuard)
    @Get(':id')
    async getPostById(
        @Param('id', ParseIntPipe) postId: number,
        @Req() req: RequestWithUser
    ) {
        const userId = req.user?.id || undefined;
        return this.postsService.getPostById(postId, userId);
    }

    // Rota protegida - requer autenticação
    @UseGuards(JwtGuard)
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

    // Rota protegida - requer autenticação
    @UseGuards(JwtGuard)
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

    // Rota protegida - requer autenticação
    @UseGuards(JwtGuard)
    @Delete(':id')
    @HttpCode(HttpStatus.ACCEPTED)
    async deletePostById(
        @GetUser('id') userId: number,
        @Param('id', ParseIntPipe) postId: number,
    ) {
        return this.postsService.deletePostById(userId, postId);
    }

    // Rota protegida - requer autenticação
    @UseGuards(JwtGuard)
    @Post(':id/favorite')
    @HttpCode(HttpStatus.OK)
    async toggleFavorite(
        @GetUser('id') userId: number,
        @Param('id', ParseIntPipe) postId: number
    ) {
        return this.postsService.toggleFavorite(userId, postId);
    }
}