/**
 * 关注相关 API
 */
import apiClient from './client';
import type { ApiResponse, User } from '../types/api';

export const followApi = {
  /**
   * 关注用户
   */
  followUser: async (userId: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(`/users/${userId}/follow`);
    return response.data;
  },

  /**
   * 取消关注用户
   */
  unfollowUser: async (userId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(`/users/${userId}/follow`);
    return response.data;
  },

  /**
   * 获取关注列表
   */
  getFollowing: async (userId: string): Promise<ApiResponse<{ users: User[] }>> => {
    const response = await apiClient.get<ApiResponse<{ users: User[] }>>(
      `/users/${userId}/following`
    );
    return response.data;
  },

  /**
   * 获取粉丝列表
   */
  getFollowers: async (userId: string): Promise<ApiResponse<{ users: User[] }>> => {
    const response = await apiClient.get<ApiResponse<{ users: User[] }>>(
      `/users/${userId}/followers`
    );
    return response.data;
  },
};
