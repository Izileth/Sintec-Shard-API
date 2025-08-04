import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreatePostDto, UpdatePostDto, PostFilterDto } from './types';
import { PrismaService } from 'src/prisma/prisma.service';
import { Inject } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary'; // Importar o tipo correto
@Injectable()
export class PostsService {
    constructor(
        private prisma: PrismaService, 
        @Inject('CLOUDINARY') private cloudinary: typeof cloudinary
    ){}

    private generateSlug(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
            + '-' + Date.now();
    }

    private generateCategorySlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    private generateTagSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    private async createOrGetCategories(categoryIds: number[] = [], newCategories: string[] = []) {
        const allCategoryIds: number[] = [...categoryIds];

        // Criar novas categorias se fornecidas
        if (newCategories && newCategories.length > 0) {
            for (const categoryName of newCategories) {
                try {
                    // Verificar se a categoria já existe
                    const existingCategory = await this.prisma.category.findFirst({
                        where: {
                            OR: [
                                { name: { equals: categoryName, mode: 'insensitive' } },
                                { slug: this.generateCategorySlug(categoryName) }
                            ]
                        }
                    });

                    if (existingCategory) {
                        // Se já existe, adiciona o ID à lista
                        if (!allCategoryIds.includes(existingCategory.id)) {
                            allCategoryIds.push(existingCategory.id);
                        }
                    } else {
                        // Criar nova categoria
                        const newCategory = await this.prisma.category.create({
                            data: {
                                name: categoryName.trim(),
                                slug: this.generateCategorySlug(categoryName)
                            }
                        });
                        allCategoryIds.push(newCategory.id);
                    }
                } catch (error) {
                    console.error(`Error creating category "${categoryName}":`, error);
                    // Continue com as outras categorias mesmo se uma falhar
                }
            }
        }

        return allCategoryIds;
    }

    private async createOrGetTags(tagIds: number[] = [], newTags: string[] = []) {
        const allTagIds: number[] = [...tagIds];

        // Criar novas tags se fornecidas
        if (newTags && newTags.length > 0) {
            for (const tagName of newTags) {
                try {
                    // Verificar se a tag já existe
                    const existingTag = await this.prisma.tag.findFirst({
                        where: {
                            OR: [
                                { name: { equals: tagName, mode: 'insensitive' } },
                                { slug: this.generateTagSlug(tagName) }
                            ]
                        }
                    });

                    if (existingTag) {
                        // Se já existe, adiciona o ID à lista
                        if (!allTagIds.includes(existingTag.id)) {
                            allTagIds.push(existingTag.id);
                        }
                    } else {
                        // Criar nova tag
                        const newTag = await this.prisma.tag.create({
                            data: {
                                name: tagName.trim(),
                                slug: this.generateTagSlug(tagName)
                            }
                        });
                        allTagIds.push(newTag.id);
                    }
                } catch (error) {
                    console.error(`Error creating tag "${tagName}":`, error);
                    // Continue com as outras tags mesmo se uma falhar
                }
            }
        }

        return allTagIds;
    }

    async getAllPosts(filters?: PostFilterDto, userId?: number) {
        const {
            search,
            categoryId,
            tagIds,
            published,
            authorUsername,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = filters || {};

        const skip = (page - 1) * limit;

        const where: any = {};

        // Filtros de busca
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
                { excerpt: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (categoryId) {
            where.categories = {
                some: { id: categoryId }
            };
        }

        if (tagIds && tagIds.length > 0) {
            where.tags = {
                some: { id: { in: tagIds } }
            };
        }

        if (published !== undefined) {
            where.published = published;
        }

        if (authorUsername) {
            where.author = {
                username: authorUsername
            };
        }

        const [posts, total] = await Promise.all([
            this.prisma.post.findMany({
                where,
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            avatarUrl: true,
                            email: true,
                            role: true,
                            isActive: true,
                            birthDate: true
                        }
                    },
                    categories: true,
                    tags: true,
                    comments: {
                        include: {
                            author: {
                                select: {
                                    id: true,
                                    name: true,
                                    username: true,
                                    avatarUrl: true,
                                    email: true,
                                    role: true,
                                    isActive: true,
                                    birthDate: true
                                }
                            }
                        },
                        orderBy: {
                            createdAt: 'desc' as const
                        }
                    },
                    _count: {
                        select: {
                            comments: true,
                            favoritedBy: true
                        }
                    },
                    ...(userId && {
                        favoritedBy: {
                            where: { userId },
                            select: { id: true }
                        }
                    })
                },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: limit
            }),
            this.prisma.post.count({ where })
        ]);

        // Adicionar informação se o post está favoritado pelo usuário
        const postsWithFavoriteStatus = posts.map(post => ({
            ...post,
            isFavorited: userId ? (post as any).favoritedBy?.length > 0 : false,
            favoritedBy: undefined // Remove o array para não expor dados desnecessários
        }));

        return {
            posts: postsWithFavoriteStatus,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getPostsByUser(authorId: number, userId?: number) {
        const posts = await this.prisma.post.findMany({
            where: { authorId },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true,
                        email: true,
                        role: true,
                        isActive: true,
                        birthDate: true
                    }
                },
                categories: true,
                tags: true,
                comments: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                avatarUrl: true,
                                email: true,
                                role: true,
                                isActive: true,
                                birthDate: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc' as const
                    }
                },
                _count: {
                    select: {
                        comments: true,
                        favoritedBy: true
                    }
                },
                ...(userId && {
                    favoritedBy: {
                        where: { userId },
                        select: { id: true }
                    }
                })
            },
            orderBy: { createdAt: 'desc' }
        });

        return posts.map(post => ({
            ...post,
            isFavorited: userId ? (post as any).favoritedBy?.length > 0 : false,
            favoritedBy: undefined
        }));
    }

    async getPostByUsername(username: string, userId?: number) {
        const user = await this.prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.getPostsByUser(user.id, userId);
    }

    async getPostById(postId: number, userId?: number) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true,
                        email: true,
                        role: true,
                        isActive: true,
                        birthDate: true
                    }
                },
                categories: true,
                tags: true,
                comments: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                avatarUrl: true,
                                email: true,
                                role: true,
                                isActive: true,
                                birthDate: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc' as const
                    }
                },
                _count: {
                    select: {
                        comments: true,
                        favoritedBy: true
                    }
                },
                ...(userId && {
                    favoritedBy: {
                        where: { userId },
                        select: { id: true }
                    }
                })
            }
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        return {
            ...post,
            isFavorited: userId ? (post as any).favoritedBy?.length > 0 : false,
            favoritedBy: undefined
        };
    }

    async createPost(authorId: number, dto: CreatePostDto) {
        const slug = this.generateSlug(dto.title);

        // Verificar e criar/obter categorias
        const finalCategoryIds = await this.createOrGetCategories(dto.categoryIds, dto.newCategories);

        // Verificar e criar/obter tags
        const finalTagIds = await this.createOrGetTags(dto.tagIds, dto.newTags);

        // Verificar se as categorias existentes são válidas
        if (dto.categoryIds && dto.categoryIds.length > 0) {
            const categories = await this.prisma.category.findMany({
                where: { id: { in: dto.categoryIds } }
            });
            if (categories.length !== dto.categoryIds.length) {
                throw new BadRequestException('One or more category IDs not found');
            }
        }

        // Verificar se as tags existentes são válidas
        if (dto.tagIds && dto.tagIds.length > 0) {
            const tags = await this.prisma.tag.findMany({
                where: { id: { in: dto.tagIds } }
            });
            if (tags.length !== dto.tagIds.length) {
                throw new BadRequestException('One or more tag IDs not found');
            }
        }

        const post = await this.prisma.post.create({
            data: {
                title: dto.title,
                slug,
                content: dto.content,
                excerpt: dto.excerpt,
                coverImageUrl: dto.coverImageUrl,
                metaTitle: dto.metaTitle,
                metaDescription: dto.metaDescription,
                published: dto.published || false,
                authorId,
                categories: finalCategoryIds.length > 0 ? {
                    connect: finalCategoryIds.map(id => ({ id }))
                } : undefined,
                tags: finalTagIds.length > 0 ? {
                    connect: finalTagIds.map(id => ({ id }))
                } : undefined
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true,
                        email: true,
                        role: true,
                        isActive: true,
                        birthDate: true
                    }
                },
                categories: true,
                tags: true,
                comments: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                avatarUrl: true,
                                email: true,
                                role: true,
                                isActive: true,
                                birthDate: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc' as const
                    }
                },
                _count: {
                    select: {
                        comments: true,
                        favoritedBy: true
                    }
                }
            }
        });

        return post;
    }

    async editPostById(authorId: number, postId: number, dto: UpdatePostDto) {
        // Verificar se o post existe e pertence ao usuário
        const existingPost = await this.prisma.post.findUnique({
            where: { id: postId },
            include: { author: true }
        });

        if (!existingPost) {
            throw new NotFoundException('Post not found');
        }

        if (existingPost.authorId !== authorId) {
            throw new ForbiddenException('Access to resource denied');
        }

        // Verificar e criar/obter categorias
        const finalCategoryIds = await this.createOrGetCategories(dto.categoryIds, dto.newCategories);

        // Verificar e criar/obter tags
        const finalTagIds = await this.createOrGetTags(dto.tagIds, dto.newTags);

        // Verificar categorias existentes se fornecidas
        if (dto.categoryIds && dto.categoryIds.length > 0) {
            const categories = await this.prisma.category.findMany({
                where: { id: { in: dto.categoryIds } }
            });
            if (categories.length !== dto.categoryIds.length) {
                throw new BadRequestException('One or more category IDs not found');
            }
        }

        // Verificar tags existentes se fornecidas
        if (dto.tagIds && dto.tagIds.length > 0) {
            const tags = await this.prisma.tag.findMany({
                where: { id: { in: dto.tagIds } }
            });
            if (tags.length !== dto.tagIds.length) {
                throw new BadRequestException('One or more tag IDs not found');
            }
        }

        // Deletar imagem antiga se uma nova foi fornecida
        if (dto.coverImageUrl && existingPost.coverImageUrl) {
            await this.deleteImageFromCloudinary(existingPost.coverImageUrl);
        }

        // Preparar dados de atualização
        const updateData: any = {
            title: dto.title,
            content: dto.content,
            excerpt: dto.excerpt,
            coverImageUrl: dto.coverImageUrl,
            metaTitle: dto.metaTitle,
            metaDescription: dto.metaDescription,
            published: dto.published
        };

        // Atualizar slug se o título foi alterado
        if (dto.title && dto.title !== existingPost.title) {
            updateData.slug = this.generateSlug(dto.title);
        }

        // Gerenciar relacionamentos de categorias
        if (dto.categoryIds !== undefined || dto.newCategories !== undefined) {
            if (finalCategoryIds.length > 0) {
                updateData.categories = {
                    set: [], // Remove todas as conexões existentes
                    connect: finalCategoryIds.map(id => ({ id }))
                };
            } else {
                updateData.categories = { set: [] };
            }
        }

        // Gerenciar relacionamentos de tags
        if (dto.tagIds !== undefined || dto.newTags !== undefined) {
            if (finalTagIds.length > 0) {
                updateData.tags = {
                    set: [], // Remove todas as conexões existentes
                    connect: finalTagIds.map(id => ({ id }))
                };
            } else {
                updateData.tags = { set: [] };
            }
        }

        return this.prisma.post.update({
            where: { id: postId },
            data: updateData,
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true,
                        email: true,
                        role: true,
                        isActive: true,
                        birthDate: true
                    }
                },
                categories: true,
                tags: true,
                comments: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                avatarUrl: true,
                                email: true,
                                role: true,
                                isActive: true,
                                birthDate: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc' as const
                    }
                },
                _count: {
                    select: {
                        comments: true,
                        favoritedBy: true
                    }
                }
            }
        });
    }

    async deletePostById(authorId: number, postId: number) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId }
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        if (post.authorId !== authorId) {
            throw new ForbiddenException('Access to resource denied');
        }

        // Deletar imagem do Cloudinary se existir
        if (post.coverImageUrl) {
            await this.deleteImageFromCloudinary(post.coverImageUrl);
        }

        await this.prisma.post.delete({
            where: { id: postId }
        });

        return { message: 'Post deleted successfully' };
    }

    // Métodos para gerenciar favoritos
    async toggleFavorite(userId: number, postId: number) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId }
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        const existingFavorite = await this.prisma.userFavoritePost.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId
                }
            }
        });

        if (existingFavorite) {
            // Remover dos favoritos
            await this.prisma.userFavoritePost.delete({
                where: { id: existingFavorite.id }
            });
            return { isFavorited: false, message: 'Post removed from favorites' };
        } else {
            // Adicionar aos favoritos
            await this.prisma.userFavoritePost.create({
                data: { userId, postId }
            });
            return { isFavorited: true, message: 'Post added to favorites' };
        }
    }

    async getFavoritesByUser(userId: number, filters?: PostFilterDto) {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = filters || {};
        const skip = (page - 1) * limit;

        const [favorites, total] = await Promise.all([
            this.prisma.userFavoritePost.findMany({
                where: { userId },
                include: {
                    post: {
                        include: {
                            author: {
                                select: {
                                    id: true,
                                    name: true,
                                    username: true,
                                    avatarUrl: true,
                                    email: true,
                                    role: true,
                                    isActive: true,
                                    birthDate: true
                                }
                            },
                            categories: true,
                            tags: true,
                            comments: {
                                include: {
                                    author: {
                                        select: {
                                            id: true,
                                            name: true,
                                            username: true,
                                            avatarUrl: true,
                                            email: true,
                                            role: true,
                                            isActive: true,
                                            birthDate: true
                                        }
                                    }
                                },
                                orderBy: {
                                    createdAt: 'desc' as const
                                }
                            },
                            _count: {
                                select: {
                                    comments: true,
                                    favoritedBy: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: sortOrder },
                skip,
                take: limit
            }),
            this.prisma.userFavoritePost.count({ where: { userId } })
        ]);

        const posts = favorites.map(fav => ({
            ...fav.post,
            isFavorited: true,
            favoritedBy: undefined
        }));

        return {
            posts,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    
    private async deleteImageFromCloudinary(imageUrl: string) {
        try {
            // Verificar se o cloudinary está configurado corretamente
            if (!this.cloudinary || !this.cloudinary.uploader) {
                console.warn('Cloudinary não configurado. Imagem não será deletada do storage.');
                return;
            }

            const publicId = imageUrl
                .split('/')
                .pop()
                ?.split('.')[0] || '';
                
            if (publicId) {
                const result = await this.cloudinary.uploader.destroy(publicId);
                console.log(`Resultado da exclusão da imagem ${publicId}:`, result);
                
                // Verificar se a exclusão foi bem-sucedida
                if (result.result === 'ok') {
                    console.log(`Imagem ${publicId} deletada com sucesso do Cloudinary`);
                } else {
                    console.warn(`Imagem ${publicId} não foi encontrada no Cloudinary:`, result);
                }
            }
        } catch (error) {
            console.error('Error deleting image from Cloudinary:', error);
        }
    }
}