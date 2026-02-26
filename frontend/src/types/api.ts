/**
 * API 响应类型定义
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * 用户相关类型
 */
export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  isVerified: boolean;
  role?: string; // 'user' | 'admin' | 'super_admin'
  isAdmin?: boolean; // 兼容字段
  postCount?: number;
  followerCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * 帖子相关类型
 */
export interface Post {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  content: string;
  images?: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  isLiked?: boolean;
  isFavorited?: boolean;
}

export interface PostListResponse {
  posts: Post[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  categoryId: string;
  images?: string[];
}

/**
 * 分类相关类型
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
  isAnonymous?: boolean;
  postCount: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 评论相关类型
 */
export interface Comment {
  id: string;
  postId?: string;
  userId: string;
  parentId?: string;
  content: string;
  likeCount: number;
  replyCount?: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  replies?: Comment[];
  isLiked?: boolean;
}

export interface CreateCommentRequest {
  content: string;
  parentId?: string;
}
