/**
 * 分类相关 API
 */
import apiClient from './client';
import type { ApiResponse, Category } from '../types/api';

export const categoriesApi = {
  /**
   * 获取分类列表
   */
  getCategories: async (): Promise<ApiResponse<{ categories: Category[] }>> => {
    const response = await apiClient.get<ApiResponse<{ categories: Category[] }>>('/categories');
    return response.data;
  },

  /**
   * 获取分类详情
   */
  getCategoryById: async (id: string): Promise<ApiResponse<Category>> => {
    const response = await apiClient.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data;
  },
};
