import { PostType } from "./post.community.type";

export class CommunityPostResponseDto {
  id: number;
  title: string;
  content?: string;
  type: PostType;
  imageUrl?: string;
  videoUrl?: string;
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
  isApproved: boolean;
  isActive: boolean;
  isPinned: boolean;
  isLocked: boolean;
  upvotes: number;
  downvotes: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    username: string;
    name: string;
    avatarUrl?: string;
  };
  community: {
    id: number;
    name: string;
    displayName: string;
    prefix: string;
  };
  userVote?: 'up' | 'down' | null;
  canEdit?: boolean;
  canDelete?: boolean;
  canModerate?: boolean;
}