/**
 * 帖子相关 API
 */
import apiClient from './client';
import type {
  ApiResponse,
  Post,
  PostListResponse,
  CreatePostRequest,
} from '../types/api';

export const postsApi = {
  /**
   * 获取帖子列表
   */
  getPosts: async (params?: {
    page?: number;
    pageSize?: number;
    categoryId?: string;
    userId?: string;
    sort?: 'latest' | 'hot' | 'trending';
  }): Promise<ApiResponse<PostListResponse>> => {
    const response = await apiClient.get<ApiResponse<PostListResponse>>('/posts', { params });
    return response.data;
  },

  /**
   * 获取帖子详情
   */
  getPostById: async (id: string): Promise<ApiResponse<Post>> => {
    const response = await apiClient.get<ApiResponse<Post>>(`/posts/${id}`);
    return response.data;
  },

  /**
   * 创建帖子
   */
  createPost: async (data: CreatePostRequest): Promise<ApiResponse<Post>> => {
    const response = await apiClient.post<ApiResponse<Post>>('/posts', data);
    return response.data;
  },

  /**
   * 更新帖子
   */
  updatePost: async (id: string, data: Partial<CreatePostRequest>): Promise<ApiResponse<Post>> => {
    const response = await apiClient.put<ApiResponse<Post>>(`/posts/${id}`, data);
    return response.data;
  },

  /**
   * 删除帖子
   */
  deletePost: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(`/posts/${id}`);
    return response.data;
  },

  /**
   * 搜索帖子
   */
  searchPosts: async (keyword: string, params?: {
    categoryId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<PostListResponse>> => {
    const response = await apiClient.get<ApiResponse<PostListResponse>>('/posts/search', {
      params: { keyword, ...params },
    });
    return response.data;
  },
};
