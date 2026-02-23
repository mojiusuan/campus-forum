/**
 * 管理员相关 API
 */
import apiClient from './client';
import type { ApiResponse } from '../types/api';

export const adminApi = {
  /**
   * 获取概览统计
   */
  getOverviewStats: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/admin/stats/overview');
    return response.data;
  },

  /**
   * 获取帖子列表（管理员视图）
   */
  getPosts: async (params?: {
    page?: number;
    limit?: number;
    keyword?: string;
    categoryId?: string;
    userId?: string;
    status?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/admin/posts', { params });
    return response.data;
  },

  /**
   * 删除帖子（硬删除）
   */
  deletePost: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/admin/posts/${id}`);
    return response.data;
  },

  /**
   * 恢复帖子
   */
  restorePost: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.post(`/admin/posts/${id}/restore`);
    return response.data;
  },

  /**
   * 置顶帖子
   */
  pinPost: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.post(`/admin/posts/${id}/pin`);
    return response.data;
  },

  /**
   * 取消置顶
   */
  unpinPost: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/admin/posts/${id}/pin`);
    return response.data;
  },

  /**
   * 锁定帖子
   */
  lockPost: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.post(`/admin/posts/${id}/lock`);
    return response.data;
  },

  /**
   * 解锁帖子
   */
  unlockPost: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/admin/posts/${id}/lock`);
    return response.data;
  },

  /**
   * 获取评论列表（管理员视图）
   */
  getComments: async (params?: {
    page?: number;
    limit?: number;
    keyword?: string;
    postId?: string;
    userId?: string;
    status?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/admin/comments', { params });
    return response.data;
  },

  /**
   * 删除评论（硬删除）
   */
  deleteComment: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/admin/comments/${id}`);
    return response.data;
  },

  /**
   * 恢复评论
   */
  restoreComment: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.post(`/admin/comments/${id}/restore`);
    return response.data;
  },

  /**
   * 获取用户列表
   */
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    keyword?: string;
    role?: string;
    status?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  /**
   * 获取用户详情
   */
  getUserById: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data;
  },

  /**
   * 封禁用户
   */
  banUser: async (id: string, reason: string): Promise<ApiResponse> => {
    const response = await apiClient.post(`/admin/users/${id}/ban`, { reason });
    return response.data;
  },

  /**
   * 解封用户
   */
  unbanUser: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.post(`/admin/users/${id}/unban`);
    return response.data;
  },

  /**
   * 更新用户信息
   */
  updateUser: async (id: string, data: {
    username?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<ApiResponse> => {
    const response = await apiClient.put(`/admin/users/${id}`, data);
    return response.data;
  },

  /**
   * 重置用户密码
   */
  resetPassword: async (id: string, newPassword: string): Promise<ApiResponse> => {
    const response = await apiClient.post(`/admin/users/${id}/reset-password`, {
      newPassword,
    });
    return response.data;
  },

  /**
   * 获取分类列表
   */
  getCategories: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/admin/categories');
    return response.data;
  },

  /**
   * 创建分类
   */
  createCategory: async (data: {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    color?: string;
    sortOrder?: number;
  }): Promise<ApiResponse> => {
    const response = await apiClient.post('/admin/categories', data);
    return response.data;
  },

  /**
   * 更新分类
   */
  updateCategory: async (id: string, data: {
    name?: string;
    slug?: string;
    description?: string;
    icon?: string;
    color?: string;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<ApiResponse> => {
    const response = await apiClient.put(`/admin/categories/${id}`, data);
    return response.data;
  },

  /**
   * 删除分类
   */
  deleteCategory: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/admin/categories/${id}`);
    return response.data;
  },

  /**
   * 调整分类顺序
   */
  reorderCategories: async (categories: { id: string; sortOrder: number }[]): Promise<ApiResponse> => {
    const response = await apiClient.post('/admin/categories/reorder', { categories });
    return response.data;
  },

  /**
   * 获取用户统计
   */
  getUserStats: async (period?: '7d' | '30d' | 'all'): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/admin/stats/users', {
      params: { period },
    });
    return response.data;
  },

  /**
   * 获取帖子统计
   */
  getPostStats: async (period?: '7d' | '30d' | 'all'): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/admin/stats/posts', {
      params: { period },
    });
    return response.data;
  },

  /**
   * 获取分类统计
   */
  getCategoryStats: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/admin/stats/categories');
    return response.data;
  },

  /**
   * 获取学习资料列表（管理员视图）
   */
  getResources: async (params?: {
    page?: number;
    limit?: number;
    keyword?: string;
    userId?: string;
    fileType?: string;
    status?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/admin/resources', { params });
    return response.data;
  },

  /**
   * 删除学习资料（硬删除）
   */
  deleteResource: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/admin/resources/${id}`);
    return response.data;
  },

  /**
   * 恢复学习资料
   */
  restoreResource: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.post(`/admin/resources/${id}/restore`);
    return response.data;
  },

  /**
   * 获取操作日志
   */
  getLogs: async (params?: {
    page?: number;
    limit?: number;
    adminId?: string;
    action?: string;
    targetType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/admin/logs', { params });
    return response.data;
  },
};
