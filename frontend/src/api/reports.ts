/**
 * 举报相关 API
 */
import apiClient from './client';
import type { ApiResponse } from '../types/api';

export const reportsApi = {
  /**
   * 提交举报（帖子或资料）
   */
  create: async (data: {
    targetType: 'post' | 'resource';
    targetId: string;
    reason: string;
  }): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/reports', data);
    return response.data;
  },
};
