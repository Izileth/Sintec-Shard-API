
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
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


@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  public getPrisma(): PrismaService {
  return this.prisma;
}

  // Criar comentário
  async createComment(userId: number, createCommentDto: CreateCommentDto): Promise<CommentDto> {
    const { content, postId, parentId } = createCommentDto;

    // Verificar se o post existe
    const post = await this.prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    // Se for uma resposta, verificar se o comentário pai existe
    if (parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: parentId }
      });

      if (!parentComment || parentComment.postId !== postId) {
        throw new BadRequestException('Comentário pai não encontrado ou não pertence ao mesmo post');
      }
    }

    // Criar o comentário
    const comment = await this.prisma.comment.create({
      data: {
        content,
        postId,
        authorId: userId,
        parentId
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
        _count: {
          select: {
            replies: true
          }
        }
      }
    });

    // Se for uma resposta, incrementar o contador do comentário pai
    if (parentId) {
      await this.prisma.comment.update({
        where: { id: parentId },
        data: {
          repliesCount: {
            increment: 1
          }
        }
      });
    }

    return this.mapCommentToDto(comment, userId);
  }

  // Buscar comentários por post com paginação e filtros
  async getCommentsByPostId(postId: number, query: CommentQueryDto, userId?: number): Promise<PaginatedCommentsDto> {
    const { page = 1, limit = 20, sortBy = 'newest', parentId } = query;
    const skip = (page - 1) * limit;

    // Verificar se o post existe
    const post = await this.prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    // Configurar ordenação
    let orderBy: any = { createdAt: 'desc' }; // newest por padrão

    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'popular':
        orderBy = { likesCount: 'desc' };
        break;
      case 'controversial':
        orderBy = [
          { dislikesCount: 'desc' },
          { likesCount: 'desc' }
        ];
        break;
    }

    // Condições da busca
    const where: any = {
      postId,
      isActive: true,
      isApproved: true
    };

    if (parentId !== undefined) {
      where.parentId = parentId;
    } else {
      // Se não especificar parentId, buscar apenas comentários principais (não respostas)
      where.parentId = null;
    }

    // Buscar comentários
    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true
            }
          },
          likes: userId ? {
            where: { userId },
            select: { id: true }
          } : false,
          dislikes: userId ? {
            where: { userId },
            select: { id: true }
          } : false,
          shares: userId ? {
            where: { userId },
            select: { id: true }
          } : false,
          replies: parentId === undefined ? {
            where: {
              isActive: true,
              isApproved: true
            },
            take: 3,
            orderBy: { createdAt: 'asc' },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  avatarUrl: true
                }
              }
            }
          } : false
        },
        orderBy,
        skip,
        take: 10,
      }),
      this.prisma.comment.count({ where })
    ]);

    // Buscar estatísticas
    const stats = await this.getCommentStats(postId);

    const mappedComments = comments.map(comment => this.mapCommentToDto(comment, userId));

    return {
      comments: mappedComments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      stats
    };
  }

  // Buscar comentário por ID
  async getCommentById(commentId: number, userId?: number): Promise<CommentDto> {
    const comment = await this.prisma.comment.findUnique({
      where: { 
        id: commentId,
        isActive: true,
        isApproved: true
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
        likes: userId ? {
          where: { userId },
          select: { id: true }
        } : false,
        dislikes: userId ? {
          where: { userId },
          select: { id: true }
        } : false,
        shares: userId ? {
          where: { userId },
          select: { id: true }
        } : false,
        replies: {
          where: {
            isActive: true,
            isApproved: true
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!comment) {
      throw new NotFoundException('Comentário não encontrado');
    }

    return this.mapCommentToDto(comment, userId);
  }

  // Atualizar comentário
  async updateComment(commentId: number, userId: number, updateCommentDto: UpdateCommentDto): Promise<CommentDto> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      throw new NotFoundException('Comentário não encontrado');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('Você só pode editar seus próprios comentários');
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        content: updateCommentDto.content,
        isEdited: true,
        editedAt: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    });

    return this.mapCommentToDto(updatedComment, userId);
  }

  // Deletar comentário
  async deleteComment(commentId: number, userId: number): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: true
      }
    });

    if (!comment) {
      throw new NotFoundException('Comentário não encontrado');
    }

    // Verificar permissão (autor ou admin)
    if (comment.authorId !== userId && comment.author?.role !== 'ADMIN') {
      throw new ForbiddenException('Você não tem permissão para deletar este comentário');
    }

    // Soft delete - marcar como inativo ao invés de deletar
    await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        isActive: false,
        content: '[Comentário removido]'
      }
    });

    // Se for uma resposta, decrementar o contador do comentário pai
    if (comment.parentId) {
      await this.prisma.comment.update({
        where: { id: comment.parentId },
        data: {
          repliesCount: {
            decrement: 1
          }
        }
      });
    }
  }

  // Curtir comentário
  async likeComment(commentId: number, userId: number): Promise<{ liked: boolean; likesCount: number }> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      throw new NotFoundException('Comentário não encontrado');
    }

    // Verificar se já curtiu
    const existingLike = await this.prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId
        }
      }
    });

    let liked: boolean;
    let likesCount: number;

    if (existingLike) {
      // Remover curtida
      await this.prisma.commentLike.delete({
        where: { id: existingLike.id }
      });

      const updatedComment = await this.prisma.comment.update({
        where: { id: commentId },
        data: {
          likesCount: {
            decrement: 1
          }
        }
      });

      liked = false;
      likesCount = updatedComment.likesCount;
    } else {
      // Remover dislike se existir
      await this.prisma.commentDislike.deleteMany({
        where: {
          userId,
          commentId
        }
      });

      // Adicionar curtida
      await this.prisma.commentLike.create({
        data: {
          userId,
          commentId
        }
      });

      const updatedComment = await this.prisma.comment.update({
        where: { id: commentId },
        data: {
          likesCount: {
            increment: 1
          },
          dislikesCount: comment.dislikesCount > 0 ? {
            decrement: 1
          } : undefined
        }
      });

      liked = true;
      likesCount = updatedComment.likesCount;
    }

    return { liked, likesCount };
  }

  // Não curtir comentário
  async dislikeComment(commentId: number, userId: number): Promise<{ disliked: boolean; dislikesCount: number }> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      throw new NotFoundException('Comentário não encontrado');
    }

    // Verificar se já não curtiu
    const existingDislike = await this.prisma.commentDislike.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId
        }
      }
    });

    let disliked: boolean;
    let dislikesCount: number;

    if (existingDislike) {
      // Remover dislike
      await this.prisma.commentDislike.delete({
        where: { id: existingDislike.id }
      });

      const updatedComment = await this.prisma.comment.update({
        where: { id: commentId },
        data: {
          dislikesCount: {
            decrement: 1
          }
        }
      });

      disliked = false;
      dislikesCount = updatedComment.dislikesCount;
    } else {
      // Remover like se existir
      await this.prisma.commentLike.deleteMany({
        where: {
          userId,
          commentId
        }
      });

      // Adicionar dislike
      await this.prisma.commentDislike.create({
        data: {
          userId,
          commentId
        }
      });

      const updatedComment = await this.prisma.comment.update({
        where: { id: commentId },
        data: {
          dislikesCount: {
            increment: 1
          },
          likesCount: comment.likesCount > 0 ? {
            decrement: 1
          } : undefined
        }
      });

      disliked = true;
      dislikesCount = updatedComment.dislikesCount;
    }

    return { disliked, dislikesCount };
  }

  // Compartilhar comentário
  async shareComment(commentId: number, userId: number, shareDto: ShareCommentDto): Promise<{ shared: boolean; sharesCount: number }> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      throw new NotFoundException('Comentário não encontrado');
    }

    // Registrar compartilhamento
    await this.prisma.commentShare.create({
      data: {
        userId,
        commentId,
        shareType: shareDto.shareType,
        platform: shareDto.platform
      }
    });

    // Incrementar contador
    const updatedComment = await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        sharesCount: {
          increment: 1
        }
      }
    });

    return { shared: true, sharesCount: updatedComment.sharesCount };
  }

  // Reportar comentário
  async reportComment(commentId: number, userId: number, reportDto: ReportCommentDto): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      throw new NotFoundException('Comentário não encontrado');
    }

    // Verificar se já reportou
    const existingReport = await this.prisma.commentReport.findFirst({
      where: {
        commentId,
        reporterId: userId
      }
    });

    if (existingReport) {
      throw new BadRequestException('Você já reportou este comentário');
    }

    // Criar report
    await this.prisma.commentReport.create({
      data: {
        commentId,
        reporterId: userId,
        reason: reportDto.reason,
        description: reportDto.description
      }
    });

    // Incrementar contador de reports
    await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        reportsCount: {
          increment: 1
        }
      }
    });
  }

  // Buscar estatísticas dos comentários
  async getCommentStats(postId: number): Promise<CommentStatsDto> {
    const stats = await this.prisma.comment.aggregate({
      where: {
        postId,
        isActive: true,
        isApproved: true
      },
      _count: {
        id: true
      },
      _sum: {
        likesCount: true,
        dislikesCount: true,
        sharesCount: true,
        repliesCount: true
      }
    });

    const totalComments = stats._count.id || 0;
    const totalLikes = stats._sum.likesCount || 0;
    const totalDislikes = stats._sum.dislikesCount || 0;
    const totalShares = stats._sum.sharesCount || 0;
    const totalReplies = stats._sum.repliesCount || 0;

    const averageEngagement = totalComments > 0 
      ? (totalLikes + totalDislikes + totalShares) / totalComments 
      : 0;

    return {
      totalComments,
      totalReplies,
      totalLikes,
      totalDislikes,
      totalShares,
      averageEngagement: Math.round(averageEngagement * 100) / 100
    };
  }

  // Método helper para mapear comment para DTO
  private mapCommentToDto(comment: any, userId?: number): CommentDto {
    return {
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
      author: {
        id: comment.author.id,
        name: comment.author.name,
        username: comment.author.username,
        avatarUrl: comment.author.avatarUrl
      },
      userHasLiked: userId ? (comment.likes && comment.likes.length > 0) : undefined,
      userHasDisliked: userId ? (comment.dislikes && comment.dislikes.length > 0) : undefined,
      userHasShared: userId ? (comment.shares && comment.shares.length > 0) : undefined,
      parentId: comment.parentId,
      replies: comment.replies ? comment.replies.map((reply: any) => this.mapCommentToDto(reply, userId)) : undefined,
      postId: comment.postId
    };
  }
}