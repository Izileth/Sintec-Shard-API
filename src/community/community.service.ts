
import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CommunityResponseDto,
  CommunityPostResponseDto,
  CreateCommunityDto,
  UpdateCommunityDto,
  CommunityQueryDto,
  JoinCommunityDto,
  CreateCommunityPostDto,
  UpdateCommunityPostDto,
  CommunityPostQueryDto,
  BanUserDto,
  AddModeratorDto,
  UpdateModeratorDto

} from './types';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  // Criar comunidade
  async create(createCommunityDto: CreateCommunityDto, ownerId: number): Promise<CommunityResponseDto> {
    // Verificar se já existe uma comunidade com o mesmo nome
    const existingCommunity = await this.prisma.community.findUnique({
      where: { name: createCommunityDto.name }
    });

    if (existingCommunity) {
      throw new ConflictException('Já existe uma comunidade com este nome');
    }

    // Criar slug baseado no nome
    const slug = createCommunityDto.name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const community = await this.prisma.community.create({
      data: {
        ...createCommunityDto,
        slug,
        ownerId,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          }
        }
      }
    });

    // Automaticamente adicionar o criador como membro
    await this.prisma.communityMember.create({
      data: {
        communityId: community.id,
        userId: ownerId,
      }
    });

    // Atualizar contador de membros
    await this.prisma.community.update({
      where: { id: community.id },
      data: { membersCount: 1 }
    });

    return this.formatCommunityResponse(community, ownerId);
  }

  // Buscar comunidades
  async findAll(query: CommunityQueryDto, userId?: number) {
    const { page = 1, limit, search, sortBy, sortOrder, privateOnly, prefix } = query;
    const skip = page ? (page - 1) * (limit ?? 20) : 0;

    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (privateOnly !== undefined) {
      where.isPrivate = privateOnly;
    }

    if (prefix) {
      where.prefix = prefix;
    }

    const [communities, total] = await Promise.all([
      this.prisma.community.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy as string]: sortOrder,
        },
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            }
          },
          members: userId ? {
            where: { userId },
            select: { id: true }
          } : false,
          moderators: userId ? {
            where: { userId },
            select: { id: true }
          } : false,
        }
      }),
      this.prisma.community.count({ where })
    ]);

    const formattedCommunities = communities.map(community => 
      this.formatCommunityResponse(community, userId)
    );

    return {
      data: formattedCommunities,
      meta: {
        total,
        page,
        limit: limit ?? 20,
        totalPages: Math.ceil(total / (limit ?? 20)),
      }
    };
  }

  // Buscar comunidade por nome/slug
  async findOne(identifier: string, userId?: number): Promise<CommunityResponseDto> {
    const community = await this.prisma.community.findFirst({
      where: {
        OR: [
          { name: identifier },
          { slug: identifier }
        ],
        isActive: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          }
        },
        members: userId ? {
          where: { userId },
          select: { id: true }
        } : false,
        moderators: userId ? {
          where: { userId },
          select: { id: true }
        } : false,
        bans: userId ? {
          where: { userId, isActive: true },
          select: { id: true }
        } : false,
      }
    });

    if (!community) {
      throw new NotFoundException('Comunidade não encontrada');
    }

    return this.formatCommunityResponse(community, userId);
  }

  // Atualizar comunidade
  async update(id: number, updateCommunityDto: UpdateCommunityDto, userId: number): Promise<CommunityResponseDto> {
    const community = await this.findCommunityWithPermissions(id, userId);
    
    if (!this.canEditCommunity(community, userId)) {
      throw new ForbiddenException('Você não tem permissão para editar esta comunidade');
    }

    // Se está mudando o nome, verificar se não existe outro com o mesmo nome
    if (updateCommunityDto.name && updateCommunityDto.name !== community.name) {
      const existingCommunity = await this.prisma.community.findUnique({
        where: { name: updateCommunityDto.name }
      });

      if (existingCommunity) {
        throw new ConflictException('Já existe uma comunidade com este nome');
      }
    }

    const updatedCommunity = await this.prisma.community.update({
      where: { id },
      data: updateCommunityDto,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          }
        }
      }
    });

    return this.formatCommunityResponse(updatedCommunity, userId);
  }

  // Deletar comunidade (soft delete)
  async remove(id: number, userId: number): Promise<void> {
    const community = await this.findCommunityWithPermissions(id, userId);
    
    if (community.ownerId !== userId) {
      throw new ForbiddenException('Apenas o dono pode deletar a comunidade');
    }

    await this.prisma.community.update({
      where: { id },
      data: { isActive: false }
    });
  }

  // Entrar na comunidade
  async joinCommunity(communityId: number, userId: number, joinDto?: JoinCommunityDto): Promise<void> {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId, isActive: true }
    });

    if (!community) {
      throw new NotFoundException('Comunidade não encontrada');
    }

    // Verificar se usuário está banido
    const ban = await this.prisma.communityBan.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId
        },
        isActive: true
      }
    });

    if (ban && (ban.isPermanent || (ban.expiresAt && ban.expiresAt > new Date()))) {
      throw new ForbiddenException('Você está banido desta comunidade');
    }

    // Verificar se já é membro
    const existingMember = await this.prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId
        }
      }
    });

    if (existingMember && existingMember.isActive) {
      throw new ConflictException('Você já é membro desta comunidade');
    }

    // Criar ou reativar membership
    await this.prisma.communityMember.upsert({
      where: {
        communityId_userId: {
          communityId,
          userId
        }
      },
      update: {
        isActive: true,
        joinedAt: new Date()
      },
      create: {
        communityId,
        userId
      }
    });

    // Atualizar contador de membros
    await this.updateMembersCount(communityId);
  }

  // Sair da comunidade
  async leaveCommunity(communityId: number, userId: number): Promise<void> {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId }
    });

    if (!community) {
      throw new NotFoundException('Comunidade não encontrada');
    }

    if (community.ownerId === userId) {
      throw new BadRequestException('O dono da comunidade não pode sair dela');
    }

    const member = await this.prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId
        }
      }
    });

    if (!member || !member.isActive) {
      throw new NotFoundException('Você não é membro desta comunidade');
    }

    await this.prisma.communityMember.update({
      where: {
        communityId_userId: {
          communityId,
          userId
        }
      },
      data: { isActive: false }
    });

    // Remover moderador se for um
    await this.prisma.communityModerator.deleteMany({
      where: {
        communityId,
        userId
      }
    });

    // Atualizar contador de membros
    await this.updateMembersCount(communityId);
  }

  // Buscar posts da comunidade
  async findCommunityPosts(communitySlug: string, query: CommunityPostQueryDto, userId?: number) {
    const community = await this.prisma.community.findFirst({
      where: {
        OR: [{ name: communitySlug }, { slug: communitySlug }],
        isActive: true
      }
    });

    if (!community) {
      throw new NotFoundException('Comunidade não encontrada');
    }

    const { page, limit, search, sort, time, type, status } = query;
    const skip = (page ?? 1) - 1 === 0 ? 0 : (page ?? 1 - 1) * (limit ?? 20);

    const where: any = {
      communityId: community.id,
      isActive: true,
    };

    if (status === 'approved') {
      where.isApproved = true;
    } else if (status === 'pending') {
      where.isApproved = false;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (type) {
      where.type = type;
    }

    // Filtro de tempo
    if (time && time !== 'all') {
      const now = new Date();
      const timeMap = {
        hour: new Date(now.getTime() - 60 * 60 * 1000),
        day: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      };
      where.createdAt = { gte: timeMap[time] };
    }

    // Ordenação
    let orderBy: any = {};
    switch (sort) {
      case 'hot':
        // Algoritmo simples de "hot" baseado em upvotes e tempo
        orderBy = [
          { upvotes: 'desc' },
          { createdAt: 'desc' }
        ];
        break;
      case 'new':
        orderBy = { createdAt: 'desc' };
        break;
      case 'top':
        orderBy = { upvotes: 'desc' };
        break;
      case 'controversial':
        // Posts com muitos upvotes E downvotes
        orderBy = [
          { downvotes: 'desc' },
          { upvotes: 'desc' }
        ];
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [posts, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            }
          },
          community: {
            select: {
              id: true,
              name: true,
              displayName: true,
              prefix: true,
            }
          }
        }
      }),
      this.prisma.communityPost.count({ where })
    ]);

    const formattedPosts = await Promise.all(
      posts.map(post => this.formatCommunityPostResponse(post, userId))
    );

    return {
      data: formattedPosts,
      meta: {
        total,
        page,
        limit,
        totalPages: limit ? Math.ceil(total / limit) : 1,
      }
    };
  }

  // Criar post na comunidade
  async createPost(communitySlug: string, createPostDto: CreateCommunityPostDto, userId: number): Promise<CommunityPostResponseDto> {
    const community = await this.prisma.community.findFirst({
      where: {
        OR: [{ name: communitySlug }, { slug: communitySlug }],
        isActive: true
      }
    });

    if (!community) {
      throw new NotFoundException('Comunidade não encontrada');
    }

    // Verificar se usuário é membro
    const member = await this.prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: community.id,
          userId
        }
      }
    });

    if (!member || !member.isActive) {
      throw new ForbiddenException('Você precisa ser membro da comunidade para postar');
    }

    // Verificar se usuário está banido
    const ban = await this.prisma.communityBan.findUnique({
      where: {
        communityId_userId: {
          communityId: community.id,
          userId
        },
        isActive: true
      }
    });


    if (ban && (ban.isPermanent || (ban.expiresAt !== null && ban.expiresAt > new Date()))) {
      throw new ForbiddenException('Você está banido desta comunidade');
    }
    // Criar post
    const post = await this.prisma.communityPost.create({
      data: {
        ...createPostDto,
        communityId: community.id,
        authorId: userId,
        isApproved: !community.requireApproval, // Auto-aprovado se não requer aprovação
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          }
        },
        community: {
          select: {
            id: true,
            name: true,
            displayName: true,
            prefix: true,
          }
        }
      }
    });

    // Atualizar contador de posts se aprovado
    if (post.isApproved) {
      await this.updatePostsCount(community.id);
    }

    return this.formatCommunityPostResponse(post, userId);
  }

  // Buscar post específico
  async findPost(communitySlug: string, postId: number, userId?: number): Promise<CommunityPostResponseDto> {
    const post = await this.prisma.communityPost.findFirst({
      where: {
        id: postId,
        community: {
          OR: [{ name: communitySlug }, { slug: communitySlug }],
          isActive: true
        },
        isActive: true,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          }
        },
        community: {
          select: {
            id: true,
            name: true,
            displayName: true,
            prefix: true,
          }
        }
      }
    });

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    return this.formatCommunityPostResponse(post, userId);
  }

  // Atualizar post
  async updatePost(communitySlug: string, postId: number, updatePostDto: UpdateCommunityPostDto, userId: number): Promise<CommunityPostResponseDto> {
    const post = await this.prisma.communityPost.findFirst({
      where: {
        id: postId,
        community: {
          OR: [{ name: communitySlug }, { slug: communitySlug }]
        }
      },
      include: {
        community: {
          include: {
            moderators: {
              where: { userId }
            }
          }
        }
      }
    });

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    // Verificar permissões
    const canEdit = post.authorId === userId || 
                   post.community.ownerId === userId ||
                   post.community.moderators.some(mod => mod.canModerate);

    if (!canEdit) {
      throw new ForbiddenException('Você não tem permissão para editar este post');
    }

    const updatedPost = await this.prisma.communityPost.update({
      where: { id: postId },
      data: updatePostDto,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          }
        },
        community: {
          select: {
            id: true,
            name: true,
            displayName: true,
            prefix: true,
          }
        }
      }
    });

    return this.formatCommunityPostResponse(updatedPost, userId);
  }

  // Deletar post
  async deletePost(communitySlug: string, postId: number, userId: number): Promise<void> {
    const post = await this.prisma.communityPost.findFirst({
      where: {
        id: postId,
        community: {
          OR: [{ name: communitySlug }, { slug: communitySlug }]
        }
      },
      include: {
        community: {
          include: {
            moderators: {
              where: { userId }
            }
          }
        }
      }
    });

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    // Verificar permissões
    const canDelete = post.authorId === userId || 
                     post.community.ownerId === userId ||
                     post.community.moderators.some(mod => mod.canModerate);

    if (!canDelete) {
      throw new ForbiddenException('Você não tem permissão para deletar este post');
    }

    await this.prisma.communityPost.update({
      where: { id: postId },
      data: { isActive: false }
    });

    // Atualizar contador de posts
    await this.updatePostsCount(post.communityId);
  }

  // Votar em post (upvote/downvote)
  async votePost(communitySlug: string, postId: number, voteType: 'up' | 'down', userId: number): Promise<void> {
    const post = await this.prisma.communityPost.findFirst({
      where: {
        id: postId,
        community: {
          OR: [{ name: communitySlug }, { slug: communitySlug }]
        },
        isActive: true,
      }
    });

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    // Verificar se usuário é membro da comunidade
    const member = await this.prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: post.communityId,
          userId
        }
      }
    });

    if (!member || !member.isActive) {
      throw new ForbiddenException('Você precisa ser membro da comunidade para votar');
    }

    // Implementar lógica de votação (você precisará criar tabelas de votos)
    // Por simplicidade, vou atualizar diretamente os contadores
    if (voteType === 'up') {
      await this.prisma.communityPost.update({
        where: { id: postId },
        data: { upvotes: { increment: 1 } }
      });
    } else {
      await this.prisma.communityPost.update({
        where: { id: postId },
        data: { downvotes: { increment: 1 } }
      });
    }
  }

  // Gerenciamento de moderadores
  async addModerator(communityId: number, addModDto: AddModeratorDto, userId: number): Promise<void> {
    const community = await this.findCommunityWithPermissions(communityId, userId);
    
    if (!this.canManageModerators(community, userId)) {
      throw new ForbiddenException('Você não tem permissão para adicionar moderadores');
    }

    // Verificar se o usuário é membro da comunidade
    const member = await this.prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId: addModDto.userId
        }
      }
    });

    if (!member || !member.isActive) {
      throw new BadRequestException('O usuário deve ser membro da comunidade');
    }

    await this.prisma.communityModerator.upsert({
      where: {
        communityId_userId: {
          communityId,
          userId: addModDto.userId
        }
      },
      update: {
        canModerate: addModDto.canModerate,
        canBan: addModDto.canBan,
        canInvite: addModDto.canInvite,
        canEdit: addModDto.canEdit,
      },
      create: {
        communityId,
        userId: addModDto.userId,
        canModerate: addModDto.canModerate,
        canBan: addModDto.canBan,
        canInvite: addModDto.canInvite,
        canEdit: addModDto.canEdit,
      }
    });
  }

  // Remover moderador
  async removeModerator(communityId: number, moderatorId: number, userId: number): Promise<void> {
    const community = await this.findCommunityWithPermissions(communityId, userId);
    
    if (!this.canManageModerators(community, userId)) {
      throw new ForbiddenException('Você não tem permissão para remover moderadores');
    }

    await this.prisma.communityModerator.delete({
      where: {
        communityId_userId: {
          communityId,
          userId: moderatorId
        }
      }
    });
  }

  // Banir usuário
  async banUser(communityId: number, userToBanId: number, banDto: BanUserDto, userId: number): Promise<void> {
    const community = await this.findCommunityWithPermissions(communityId, userId);
    
    if (!this.canBanUsers(community, userId)) {
      throw new ForbiddenException('Você não tem permissão para banir usuários');
    }

    if (community.ownerId === userToBanId) {
      throw new BadRequestException('Não é possível banir o dono da comunidade');
    }

    await this.prisma.communityBan.upsert({
      where: {
        communityId_userId: {
          communityId,
          userId: userToBanId
        }
      },
      update: {
        reason: banDto.reason,
        isPermanent: banDto.isPermanent,
        expiresAt: banDto.expiresAt ? new Date(banDto.expiresAt) : null,
        isActive: true,
        bannedBy: userId,
      },
      create: {
        communityId,
        userId: userToBanId,
        reason: banDto.reason,
        isPermanent: banDto.isPermanent,
        expiresAt: banDto.expiresAt ? new Date(banDto.expiresAt) : null,
        bannedBy: userId,
      }
    });

    // Remover da comunidade
    await this.prisma.communityMember.updateMany({
      where: {
        communityId,
        userId: userToBanId
      },
      data: { isActive: false }
    });

    // Atualizar contador de membros
    await this.updateMembersCount(communityId);
  }

  // Desbanir usuário
  async unbanUser(communityId: number, userToUnbanId: number, userId: number): Promise<void> {
    const community = await this.findCommunityWithPermissions(communityId, userId);
    
    if (!this.canBanUsers(community, userId)) {
      throw new ForbiddenException('Você não tem permissão para desbanir usuários');
    }

    await this.prisma.communityBan.updateMany({
      where: {
        communityId,
        userId: userToUnbanId
      },
      data: { isActive: false }
    });
  }

  // Atualizar permissões do moderador
  async updateModerator(communityId: number, moderatorId: number, updateModDto: UpdateModeratorDto, userId: number): Promise<void> {
    const community = await this.findCommunityWithPermissions(communityId, userId);
    
    if (!this.canManageModerators(community, userId)) {
      throw new ForbiddenException('Você não tem permissão para atualizar moderadores');
    }

    const moderator = await this.prisma.communityModerator.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId: moderatorId
        }
      }
    });

    if (!moderator) {
      throw new NotFoundException('Moderador não encontrado');
    }

    await this.prisma.communityModerator.update({
      where: {
        communityId_userId: {
          communityId,
          userId: moderatorId
        }
      },
      data: updateModDto
    });
  }

  // Buscar membros da comunidade
  async getCommunityMembers(communityId: number, query: any, userId: number) {
    const community = await this.findCommunityWithPermissions(communityId, userId);
    
    // Verificar se o usuário tem permissão para ver membros (moderador ou dono)
    const canViewMembers = community.ownerId === userId || 
                          community.moderators.some(mod => mod.canModerate);

    if (!canViewMembers) {
      throw new ForbiddenException('Você não tem permissão para ver os membros desta comunidade');
    }

    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      communityId,
      isActive: true,
    };

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const [members, total] = await Promise.all([
      this.prisma.communityMember.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            }
          }
        },
        orderBy: {
          joinedAt: 'desc'
        }
      }),
      this.prisma.communityMember.count({ where })
    ]);

    return {
      data: members.map(member => ({
        id: member.id,
        joinedAt: member.joinedAt,
        user: member.user,
        isMuted: member.isMuted,
        mutedUntil: member.mutedUntil,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  // Buscar moderadores da comunidade
  async getCommunityModerators(communityId: number) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId, isActive: true }
    });

    if (!community) {
      throw new NotFoundException('Comunidade não encontrada');
    }

    const moderators = await this.prisma.communityModerator.findMany({
      where: { communityId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return {
      data: moderators.map(mod => ({
        id: mod.id,
        user: mod.user,
        permissions: {
          canModerate: mod.canModerate,
          canBan: mod.canBan,
          canInvite: mod.canInvite,
          canEdit: mod.canEdit,
        },
        createdAt: mod.createdAt,
      }))
    };
  }

  // Buscar estatísticas da comunidade
  async getCommunityStats(communityId: number) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId, isActive: true }
    });

    if (!community) {
      throw new NotFoundException('Comunidade não encontrada');
    }

    const [
      totalMembers,
      totalPosts,
      totalComments,
      activeMembers,
      postsThisWeek,
      postsThisMonth,
      topContributors
    ] = await Promise.all([
      // Total de membros
      this.prisma.communityMember.count({
        where: { communityId, isActive: true }
      }),
      
      // Total de posts
      this.prisma.communityPost.count({
        where: { communityId, isActive: true, isApproved: true }
      }),
      
      // Total de comentários (assumindo que você conectou com o sistema de comentários)
      this.prisma.comment.count({
        where: {
          post: {
            communityPosts: {
              some: { communityId }
            }
          }
        }
      }),
      
      // Membros ativos (que postaram nos últimos 30 dias)
      this.prisma.communityMember.count({
        where: {
          communityId,
          isActive: true,
          user: {
            communityPosts: {
              some: {
                communityId,
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
              }
            }
          }
        }
      }),
      
      // Posts desta semana
      this.prisma.communityPost.count({
        where: {
          communityId,
          isActive: true,
          isApproved: true,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Posts deste mês
      this.prisma.communityPost.count({
        where: {
          communityId,
          isActive: true,
          isApproved: true,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Top contributores (usuários com mais posts aprovados)
      this.prisma.user.findMany({
        where: {
          communityPosts: {
            some: {
              communityId,
              isActive: true,
              isApproved: true
            }
          }
        },
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true,
          _count: {
            select: {
              communityPosts: {
                where: {
                  communityId,
                  isActive: true,
                  isApproved: true
                }
              }
            }
          }
        },
        orderBy: {
          communityPosts: {
            _count: 'desc'
          }
        },
        take: 10
      })
    ]);

    // Estatísticas de crescimento (últimos 6 meses)
    const growthStats = await this.getGrowthStats(communityId);

    return {
      overview: {
        totalMembers,
        totalPosts,
        totalComments,
        activeMembers,
        postsThisWeek,
        postsThisMonth,
      },
      topContributors: topContributors.map(user => ({
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
        postsCount: user._count.communityPosts
      })),
      growth: growthStats
    };
  }

  // Estatísticas de crescimento
  private async getGrowthStats(communityId: number) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
 
    const monthlyStats: { month: string; newMembers: number; newPosts: number }[] = [];
    
    for (let i = 0; i < 6; i++) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - i - 1);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      const [newMembers, newPosts] = await Promise.all([
        this.prisma.communityMember.count({
          where: {
            communityId,
            joinedAt: {
              gte: startDate,
              lt: endDate
            }
          }
        }),
        this.prisma.communityPost.count({
          where: {
            communityId,
            createdAt: {
              gte: startDate,
              lt: endDate
            },
            isActive: true,
            isApproved: true
          }
        })
      ]);

      monthlyStats.unshift({
        month: startDate.toISOString().substring(0, 7), // YYYY-MM format
        newMembers,
        newPosts
      });
    }

    return monthlyStats;
  }


  // Métodos auxiliares privados
  private async findCommunityWithPermissions(id: number, userId: number) {
    const community = await this.prisma.community.findUnique({
      where: { id, isActive: true },
      include: {
        moderators: {
          where: { userId },
          select: {
            canModerate: true,
            canBan: true,
            canInvite: true,
            canEdit: true,
          }
        }
      }
    });

    if (!community) {
      throw new NotFoundException('Comunidade não encontrada');
    }

    return community;
  }

  private canEditCommunity(community: any, userId: number): boolean {
    return community.ownerId === userId || 
           community.moderators.some(mod => mod.canEdit);
  }

  private canManageModerators(community: any, userId: number): boolean {
    return community.ownerId === userId || 
           community.moderators.some(mod => mod.canInvite);
  }

  private canBanUsers(community: any, userId: number): boolean {
    return community.ownerId === userId || 
           community.moderators.some(mod => mod.canBan);
  }

  private async updateMembersCount(communityId: number): Promise<void> {
    const count = await this.prisma.communityMember.count({
      where: {
        communityId,
        isActive: true
      }
    });

    await this.prisma.community.update({
      where: { id: communityId },
      data: { membersCount: count }
    });
  }

  private async updatePostsCount(communityId: number): Promise<void> {
    const count = await this.prisma.communityPost.count({
      where: {
        communityId,
        isActive: true,
        isApproved: true
      }
    });

    await this.prisma.community.update({
      where: { id: communityId },
      data: { postsCount: count }
    });
  }

  private formatCommunityResponse(community: any, userId?: number): CommunityResponseDto {
    return {
      id: community.id,
      name: community.name,
      slug: community.slug,
      prefix: community.prefix,
      displayName: community.displayName,
      description: community.description,
      rules: community.rules,
      avatarUrl: community.avatarUrl,
      bannerUrl: community.bannerUrl,
      primaryColor: community.primaryColor,
      isActive: community.isActive,
      isPrivate: community.isPrivate,
      requireApproval: community.requireApproval,
      allowImages: community.allowImages,
      allowVideos: community.allowVideos,
      allowPolls: community.allowPolls,
      membersCount: community.membersCount,
      postsCount: community.postsCount,
      createdAt: community.createdAt,
      updatedAt: community.updatedAt,
      owner: community.owner,
      isOwner: userId ? community.ownerId === userId : undefined,
      isModerator: userId ? community.moderators?.length > 0 : undefined,
      isMember: userId ? community.members?.length > 0 : undefined,
      isBanned: userId ? community.bans?.length > 0 : undefined,
    };
  }

  private async formatCommunityPostResponse(post: any, userId?: number): Promise<CommunityPostResponseDto> {
    // Aqui você pode implementar lógica para verificar se o usuário votou no post
    // Por simplicidade, vou deixar como null
    const userVote = null; // Implementar lógica de votação

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      type: post.type,
      imageUrl: post.imageUrl,
      videoUrl: post.videoUrl,
      linkUrl: post.linkUrl,
      linkTitle: post.linkTitle,
      linkDescription: post.linkDescription,
      isApproved: post.isApproved,
      isActive: post.isActive,
      isPinned: post.isPinned,
      isLocked: post.isLocked,
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      commentsCount: post.commentsCount,
      sharesCount: post.sharesCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.author,
      community: post.community,
      userVote,
      canEdit: userId ? post.authorId === userId : false,
      canDelete: userId ? post.authorId === userId : false,
      canModerate: false, // Implementar lógica de moderação
    };
  }
}