/**
 * 评论相关 API
 */
import apiClient from './client';
import type { ApiResponse, Comment, CreateCommentRequest } from '../types/api';

export const commentsApi = {
  /**
   * 获取评论列表
   */
  getComments: async (postId: string): Promise<ApiResponse<{ comments: Comment[] }>> => {
    const response = await apiClient.get<ApiResponse<{ comments: Comment[] }>>(
      `/posts/${postId}/comments`
    );
    return response.data;
  },

  /**
   * 创建评论
   */
  createComment: async (
    postId: string,
    data: CreateCommentRequest
  ): Promise<ApiResponse<Comment>> => {
    const response = await apiClient.post<ApiResponse<Comment>>(
      `/posts/${postId}/comments`,
      data
    );
    return response.data;
  },

  /**
   * 更新评论
   */
  updateComment: async (
    id: string,
    data: Partial<CreateCommentRequest>
  ): Promise<ApiResponse<Comment>> => {
    const response = await apiClient.put<ApiResponse<Comment>>(`/comments/${id}`, data);
    return response.data;
  },

  /**
   * 删除评论
   */
  deleteComment: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(`/comments/${id}`);
    return response.data;
  },
};
