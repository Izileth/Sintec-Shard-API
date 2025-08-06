
export class CommunityResponseDto {
  id: number;
  name: string;
  slug: string;
  prefix: string;
  displayName: string;
  description?: string;
  rules?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  isActive: boolean;
  isPrivate: boolean;
  requireApproval: boolean;
  allowImages: boolean;
  allowVideos: boolean;
  allowPolls: boolean;
  membersCount: number;
  postsCount: number;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: number;
    username: string;
    name: string;
    avatarUrl?: string;
  };
  isOwner?: boolean;
  isModerator?: boolean;
  isMember?: boolean;
  isBanned?: boolean;
}