/**
 * 互动相关 API（点赞、收藏）
 */
import apiClient from './client';
import type { ApiResponse } from '../types/api';

export const interactionsApi = {
  /**
   * 点赞帖子
   */
  likePost: async (postId: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(`/posts/${postId}/like`);
    return response.data;
  },

  /**
   * 取消点赞帖子
   */
  unlikePost: async (postId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(`/posts/${postId}/like`);
    return response.data;
  },

  /**
   * 收藏帖子
   */
  favoritePost: async (postId: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(`/posts/${postId}/favorite`);
    return response.data;
  },

  /**
   * 取消收藏帖子
   */
  unfavoritePost: async (postId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(`/posts/${postId}/favorite`);
    return response.data;
  },

  /**
   * 点赞评论
   */
  likeComment: async (commentId: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(`/comments/${commentId}/like`);
    return response.data;
  },

  /**
   * 取消点赞评论
   */
  unlikeComment: async (commentId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(`/comments/${commentId}/like`);
    return response.data;
  },
};
