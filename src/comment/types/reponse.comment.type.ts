
export class CommentAuthorDto {
  id: number;
  name: string;
  username: string;
  avatarUrl?: string;
}

export class CommentDto {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  editedAt?: Date;
  
  // Contadores
  likesCount: number;
  dislikesCount: number;
  sharesCount: number;
  repliesCount: number;
  
  // Autor
  author: CommentAuthorDto;
  
  // Status do usuário atual
  userHasLiked?: boolean;
  userHasDisliked?: boolean;
  userHasShared?: boolean;
  
  // Para comentários hierárquicos
  parentId?: number;
  replies?: CommentDto[];
  
  // Informações do post
  postId: number;
}

export class CommentStatsDto {
  totalComments: number;
  totalReplies: number;
  totalLikes: number;
  totalDislikes: number;
  totalShares: number;
  averageEngagement: number;
}

export class PaginatedCommentsDto {
  comments: CommentDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: CommentStatsDto;
}