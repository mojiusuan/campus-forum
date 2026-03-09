/**
 * 联系我们 / 用户反馈 API
 */
import apiClient from './client';
import type { ApiResponse } from '../types/api';

export interface CreateContactRequest {
  email?: string;
  subject?: string;
  content: string;
}

export const contactApi = {
  create: async (data: CreateContactRequest): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/contact', data);
    return response.data;
  },
};

