// src/comment/comment.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor
} from '@nestjs/common';

import { CommentService } from './comment.service';

import {
  CreateCommentDto,
  UpdateCommentDto,
  CommentQueryDto,
  ReportCommentDto,
  ShareCommentDto,
  CommentDto,
  PaginatedCommentsDto,
  CommentStatsDto
} from './types';

import { JwtGuard } from 'src/guards/private.jwt.guard';
import { RequestWithUser } from 'src/interfaces/request.user.iterface';
import { OptionalJwtGuard } from 'src/guards/opitional.jwt,guard';


@Controller('comments')
@UseInterceptors(ClassSerializerInterceptor)
export class CommentController {
  constructor(
    private readonly commentService: CommentService

  ) {}

  // Criar comentário
  @Post()
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Body() createCommentDto: CreateCommentDto,
    // @CurrentUser() user: any
    @Request() req: RequestWithUser // Temporário até você implementar o decorator
  ): Promise<CommentDto> {
    const userId = req.user?.id || 1; // Temporário - substitua pela implementação real
    return this.commentService.createComment(userId, createCommentDto);
  }

  // Buscar comentários por post
  @Get('post/:postId')
  @UseGuards(OptionalJwtGuard)
  async getCommentsByPost(
    @Param('postId', ParseIntPipe) postId: number,
    @Query() query: CommentQueryDto,
    @Request() req: RequestWithUser
  ): Promise<PaginatedCommentsDto> {
    const userId = req.user?.id; // Opcional
    return this.commentService.getCommentsByPostId(postId, query, userId);
  }

  // Buscar comentário por ID
  @Get(':id')
  @UseGuards(OptionalJwtGuard)
  async getCommentById(
    @Param('id', ParseIntPipe) commentId: number,
    @Request() req: RequestWithUser
  ): Promise<CommentDto> {
    const userId = req.user?.id; // Opcional
    return this.commentService.getCommentById(commentId, userId);
  }

  // Atualizar comentário
  @Put(':id')
  @UseGuards(JwtGuard)
  async updateComment(
    @Param('id', ParseIntPipe) commentId: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req: RequestWithUser
  ): Promise<CommentDto> {
    const userId = req.user?.id || 1; // Temporário
    return this.commentService.updateComment(commentId, userId, updateCommentDto);
  }

  // Deletar comentário
  @Delete(':id')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(
    @Param('id', ParseIntPipe) commentId: number,
    @Request() req: RequestWithUser
  ): Promise<void> {
    const userId = req.user?.id || 1; // Temporário
    return this.commentService.deleteComment(commentId, userId);
  }

  // Curtir comentário
  @Post(':id/like')
  @UseGuards(JwtGuard)
  async likeComment(
    @Param('id', ParseIntPipe) commentId: number,
    @Request() req: RequestWithUser
  ): Promise<{ liked: boolean; likesCount: number }> {
    const userId = req.user?.id || 1; // Temporário
    return this.commentService.likeComment(commentId, userId);
  }

  // Não curtir comentário
  @Post(':id/dislike')
  @UseGuards(JwtGuard)
  async dislikeComment(
    @Param('id', ParseIntPipe) commentId: number,
    @Request() req: RequestWithUser
  ): Promise<{ disliked: boolean; dislikesCount: number }> {
    const userId = req.user?.id || 1; // Temporário
    return this.commentService.dislikeComment(commentId, userId);
  }

  // Compartilhar comentário
  @Post(':id/share')
  
  @UseGuards(JwtGuard)
  async shareComment(
    @Param('id', ParseIntPipe) commentId: number,
    @Body() shareDto: ShareCommentDto,
    @Request() req: RequestWithUser
  ): Promise<{ shared: boolean; sharesCount: number }> {
    const userId = req.user?.id || 1; // Temporário
    return this.commentService.shareComment(commentId, userId, shareDto);
  }

  // Reportar comentário
  @Post(':id/report')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async reportComment(
    @Param('id', ParseIntPipe) commentId: number,
    @Body() reportDto: ReportCommentDto,
    @Request() req: RequestWithUser
  ): Promise<void> {
    const userId = req.user?.id || 1; // Temporário
    return this.commentService.reportComment(commentId, userId, reportDto);
  }

  // Buscar respostas de um comentário específico
  @Get(':id/replies')
  @UseGuards(OptionalJwtGuard)
  async getCommentReplies(
    @Param('id', ParseIntPipe) commentId: number,
    @Query() query: CommentQueryDto,
    @Request() req: RequestWithUser
  ): Promise<PaginatedCommentsDto> {
    const userId = req.user?.id; // Opcional
    
    // Buscar o comentário pai para pegar o postId
    const parentComment = await this.commentService.getCommentById(commentId, userId);
    
    // Definir parentId na query para buscar apenas as respostas
    const repliesQuery = { ...query, parentId: commentId };
    
    return this.commentService.getCommentsByPostId(parentComment.postId, repliesQuery, userId);
  }

  // Buscar estatísticas dos comentários de um post
  @Get('post/:postId/stats')
  async getCommentStats(
    @Param('postId', ParseIntPipe) postId: number
  ): Promise<CommentStatsDto> {
    return this.commentService.getCommentStats(postId);
  }


  @Delete(':id/reactions')
  @UseGuards(JwtGuard)
  async removeReaction(
    @Param('id', ParseIntPipe) commentId: number,
    @Request() req: RequestWithUser
  ): Promise<{ message: string }> {
    const userId = req.user?.id || 1; // Temporário
    
    // Remove both like and dislike if they exist
    await Promise.all([
      this.commentService.getPrisma().commentLike.deleteMany({
        where: { userId, commentId }
      }),
      this.commentService.getPrisma().commentDislike.deleteMany({
        where: { userId, commentId }
      })
    ]);


    return { message: 'Reação removida com sucesso' };
  }

  // Buscar comentários do usuário atual
  @Get('user/my-comments')
  @UseGuards(JwtGuard)
  async getMyComments(
    @Query() query: CommentQueryDto,
    @Request() req: RequestWithUser
  ): Promise<PaginatedCommentsDto> {
    const userId = req.user?.id || 1; // Temporário
    
    // This would need a new method in the service
    // For now, using a simple approach
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.commentService.getPrisma().comment.findMany({
        where: {
          authorId: userId,
          isActive: true
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true
            }
          },
          post: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: 10,
      }),
      this.commentService.getPrisma().comment.count({
        where: {
          authorId: userId,
          isActive: true
        }
      })
    ]);

    // Map to DTO format (simplified)
    const mappedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      isEdited: comment.isEdited,
      editedAt: comment.editedAt,
      likesCount: comment.likesCount,
      dislikesCount: comment.dislikesCount,
      sharesCount: comment.sharesCount,
      repliesCount: comment.repliesCount,
      author: comment.author,
      parentId: comment.parentId,
      postId: comment.postId,
      post: comment.post 
    }));

    return {
      comments: mappedComments as CommentDto[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      stats: await this.commentService.getCommentStats(userId)
    };
  }
}