/**
 * 用户相关 API
 */
import apiClient from './client';
import type { ApiResponse, User } from '../types/api';

export const usersApi = {
  /**
   * 获取用户信息
   */
  getUserById: async (id: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return response.data;
  },

  /**
   * 更新用户信息
   */
  updateUser: async (id: string, data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data;
  },
};
