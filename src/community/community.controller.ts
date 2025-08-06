
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
import { JwtGuard } from 'src/guards/private.jwt.guard';
import { OptionalJwtGuard } from 'src/guards/opitional.jwt,guard';
import { CloudinaryInterceptor } from 'src/interceptors/cloudnary.interceptos';
import { RequestWithUser } from 'src/interfaces/request.user.iterface';
import { CommunityService } from './community.service';


import {
    CommunityPostQueryDto,
    CreateCommunityPostDto,
    UpdateCommunityPostDto,
    CreateCommunityDto,
    UpdateCommunityDto,
    CommunityQueryDto,
    JoinCommunityDto,
    AddModeratorDto,
    UpdateModeratorDto,
    BanUserDto 
} from './types'
@Controller('communities')
export class CommunityController {
    constructor(private readonly communityService: CommunityService) {}

    // ==================== COMUNIDADES ====================

    // Listar comunidades - Rota completamente pública com auth opcional
    @UseGuards(OptionalJwtGuard)
    @Get()
    async getAllCommunities(
        @Query() query: CommunityQueryDto,
        @Req() req: RequestWithUser
    ) {
        const userId = req.user?.id || undefined;
        return this.communityService.findAll(query, userId);
    }

    // Criar nova comunidade - Rota protegida
    @UseGuards(JwtGuard)
    @Post()
    @UseInterceptors(
        FileInterceptor('avatar', {
        limits: { fileSize: 1024 * 1024 * 2 } // 2MB para avatar
        }),
        CloudinaryInterceptor
    )
    async createCommunity(
        @UploadedFile(
        new ParseFilePipe({
            validators: [
            new MaxFileSizeValidator({ maxSize: 2000000 }),
            new FileTypeValidator({ fileType: 'image/*' }),
            ],
            fileIsRequired: false
        })
        ) file: Express.Multer.File,
        @GetUser('id') userId: number,
        @Body() dto: CreateCommunityDto,
    ) {
        // Se um arquivo foi enviado, adicionar a URL ao DTO
        if (file && file.path) {
        dto.avatarUrl = file.path;
        }

        return this.communityService.create(dto, userId);
    }

    // Buscar comunidade específica - Pública com auth opcional
    @UseGuards(OptionalJwtGuard)
    @Get(':identifier')
    async getCommunity(
        @Param('identifier') identifier: string,
        @Req() req: RequestWithUser
    ) {
        const userId = req.user?.id || undefined;
        return this.communityService.findOne(identifier, userId);
    }

    // Atualizar comunidade - Rota protegida
    @UseGuards(JwtGuard)
    @Put(':id')
    @UseInterceptors(
        FileInterceptor('avatar', {
        limits: { fileSize: 1024 * 1024 * 2 } // 2MB
        }),
        CloudinaryInterceptor
    )
    async updateCommunity(
        @GetUser('id') userId: number,
        @Param('id', ParseIntPipe) id: number,
        @UploadedFile(
        new ParseFilePipe({
            validators: [
            new MaxFileSizeValidator({ maxSize: 2000000 }),
            new FileTypeValidator({ fileType: 'image/*' }),
            ],
            fileIsRequired: false
        })
        ) file: Express.Multer.File,
        @Body() dto: UpdateCommunityDto,
    ) {
        // Se um novo arquivo foi enviado, adicionar a URL ao DTO
        if (file && file.path) {
        dto.avatarUrl = file.path;
        }

        return this.communityService.update(id, dto, userId);
    }

    // Deletar comunidade - Rota protegida
    @UseGuards(JwtGuard)
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteCommunity(
        @GetUser('id') userId: number,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.communityService.remove(id, userId);
    }

    // ==================== MEMBERSHIP ====================

    // Entrar na comunidade - Rota protegida
    @UseGuards(JwtGuard)
    @Post(':id/join')
    @HttpCode(HttpStatus.OK)
    async joinCommunity(
        @GetUser('id') userId: number,
        @Param('id', ParseIntPipe) communityId: number,
        @Body() dto?: JoinCommunityDto
    ) {
        return this.communityService.joinCommunity(communityId, userId, dto);
    }

    // Sair da comunidade - Rota protegida
    @UseGuards(JwtGuard)
    @Post(':id/leave')
    @HttpCode(HttpStatus.OK)
    async leaveCommunity(
        @GetUser('id') userId: number,
        @Param('id', ParseIntPipe) communityId: number
    ) {
        return this.communityService.leaveCommunity(communityId, userId);
    }

    // ==================== POSTS DA COMUNIDADE ====================

    // Buscar posts da comunidade - Pública com auth opcional
    @UseGuards(OptionalJwtGuard)
    @Get(':communitySlug/posts')
    async getCommunityPosts(
        @Param('communitySlug') communitySlug: string,
        @Query() query: CommunityPostQueryDto,
        @Req() req: RequestWithUser
    ) {
        const userId = req.user?.id || undefined;
        return this.communityService.findCommunityPosts(communitySlug, query, userId);
    }

    // Criar post na comunidade - Rota protegida
    @UseGuards(JwtGuard)
    @Post(':communitySlug/posts')
    @UseInterceptors(
        FileInterceptor('image', {
        limits: { fileSize: 1024 * 1024 * 10 } // 10MB para posts
        }),
        CloudinaryInterceptor
    )
    async createCommunityPost(
        @UploadedFile(
        new ParseFilePipe({
            validators: [
            new MaxFileSizeValidator({ maxSize: 10000000 }),
            new FileTypeValidator({ fileType: 'image/*' }),
            ],
            fileIsRequired: false
        })
        ) file: Express.Multer.File,
        @GetUser('id') userId: number,
        @Param('communitySlug') communitySlug: string,
        @Body() dto: CreateCommunityPostDto,
    ) {
        // Se um arquivo foi enviado, adicionar a URL ao DTO
        if (file && file.path) {
        dto.imageUrl = file.path;
        }

        return this.communityService.createPost(communitySlug, dto, userId);
    }

    // Buscar post específico da comunidade - Pública com auth opcional
    @UseGuards(OptionalJwtGuard)
    @Get(':communitySlug/posts/:postId')
    async getCommunityPost(
        @Param('communitySlug') communitySlug: string,
        @Param('postId', ParseIntPipe) postId: number,
        @Req() req: RequestWithUser
    ) {
        const userId = req.user?.id || undefined;
        return this.communityService.findPost(communitySlug, postId, userId);
    }

    // Atualizar post da comunidade - Rota protegida
    @UseGuards(JwtGuard)
    @Put(':communitySlug/posts/:postId')
    @UseInterceptors(
        FileInterceptor('image', {
        limits: { fileSize: 1024 * 1024 * 10 } // 10MB
        }),
        CloudinaryInterceptor
    )
    async updateCommunityPost(
        @GetUser('id') userId: number,
        @Param('communitySlug') communitySlug: string,
        @Param('postId', ParseIntPipe) postId: number,
        @UploadedFile(
        new ParseFilePipe({
            validators: [
            new MaxFileSizeValidator({ maxSize: 10000000 }),
            new FileTypeValidator({ fileType: 'image/*' }),
            ],
            fileIsRequired: false
        })
        ) file: Express.Multer.File,
        @Body() dto: UpdateCommunityPostDto,
    ) {
        // Se um novo arquivo foi enviado, adicionar a URL ao DTO
        if (file && file.path) {
        dto.imageUrl = file.path;
        }

        return this.communityService.updatePost(communitySlug, postId, dto, userId);
    }

    // Deletar post da comunidade - Rota protegida
    @UseGuards(JwtGuard)
    @Delete(':communitySlug/posts/:postId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteCommunityPost(
        @GetUser('id') userId: number,
        @Param('communitySlug') communitySlug: string,
        @Param('postId', ParseIntPipe) postId: number,
    ) {
        return this.communityService.deletePost(communitySlug, postId, userId);
    }

    // ==================== VOTAÇÃO ====================

    // Votar em post - Rota protegida
    @UseGuards(JwtGuard)
    @Post(':communitySlug/posts/:postId/upvote')
    @HttpCode(HttpStatus.OK)
    async upvotePost(
        @GetUser('id') userId: number,
        @Param('communitySlug') communitySlug: string,
        @Param('postId', ParseIntPipe) postId: number
    ) {
        return this.communityService.votePost(communitySlug, postId, 'up', userId);
    }

    @UseGuards(JwtGuard)
    @Post(':communitySlug/posts/:postId/downvote')
    @HttpCode(HttpStatus.OK)
    async downvotePost(
        @GetUser('id') userId: number,
        @Param('communitySlug') communitySlug: string,
        @Param('postId', ParseIntPipe) postId: number
    ) {
        return this.communityService.votePost(communitySlug, postId, 'down', userId);
    }

    // ==================== MODERAÇÃO ====================

    // Adicionar moderador - Rota protegida
    @UseGuards(JwtGuard)
    @Post(':id/moderators')
    @HttpCode(HttpStatus.OK)
    async addModerator(
        @GetUser('id') userId: number,
        @Param('id', ParseIntPipe) communityId: number,
        @Body() dto: AddModeratorDto
    ) {
        return this.communityService.addModerator(communityId, dto, userId);
    }

    // Atualizar permissões do moderador - Rota protegida
    @UseGuards(JwtGuard)
    @Put(':id/moderators/:moderatorId')
    async updateModerator(
        @GetUser('id') userId: number,
        @Param('id', ParseIntPipe) communityId: number,
        @Param('moderatorId', ParseIntPipe) moderatorId: number,
        @Body() dto: UpdateModeratorDto
    ) {

        return this.communityService.updateModerator(communityId, moderatorId, dto, userId);
    }

    // Remover moderador - Rota protegida
    @UseGuards(JwtGuard)
    @Delete(':id/moderators/:moderatorId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeModerator(
        @GetUser('id') userId: number,
        @Param('id', ParseIntPipe) communityId: number,
        @Param('moderatorId', ParseIntPipe) moderatorId: number
    ) {
        return this.communityService.removeModerator(communityId, moderatorId, userId);
    }

    // ==================== BANS ====================

    // Banir usuário - Rota protegida
    @UseGuards(JwtGuard)
    @Post(':id/ban/:userToBanId')
    @HttpCode(HttpStatus.OK)
    async banUser(
        @GetUser('id') userId: number,
        @Param('id', ParseIntPipe) communityId: number,
        @Param('userToBanId', ParseIntPipe) userToBanId: number,
        @Body() dto: BanUserDto
    ) {
        return this.communityService.banUser(communityId, userToBanId, dto, userId);
    }

    // Desbanir usuário - Rota protegida
    @UseGuards(JwtGuard)
    @Post(':id/unban/:userToUnbanId')
    @HttpCode(HttpStatus.OK)
    async unbanUser(
        @GetUser('id') userId: number,
        @Param('id', ParseIntPipe) communityId: number,
        @Param('userToUnbanId', ParseIntPipe) userToUnbanId: number
    ) {
        return this.communityService.unbanUser(communityId, userToUnbanId, userId);
    }

    // ==================== ROTAS AUXILIARES ====================

    // Buscar membros da comunidade - Rota protegida (só moderadores/donos)
    @UseGuards(JwtGuard)
    @Get(':id/members')
    async getCommunityMembers(
        @GetUser('id') userId: number,
        @Param('id', ParseIntPipe) communityId: number,
        @Query() query: any
    ) {
    
        return this.communityService.getCommunityMembers(communityId, query, userId);
    }

    // Buscar moderadores da comunidade - Pública
    @Get(':id/moderators')
    async getCommunityModerators(
        @Param('id', ParseIntPipe) communityId: number
    ) {
        return this.communityService.getCommunityModerators(communityId);
    }

    // Buscar estatísticas da comunidade - Pública
    @Get(':id/stats')
    async getCommunityStats(
        @Param('id', ParseIntPipe) communityId: number
    ) {
        return this.communityService.getCommunityStats(communityId);
    }
}