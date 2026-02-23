/**
 * 学习资料相关 API
 */
import apiClient from './client';
import type { ApiResponse } from '../types/api';

export interface Resource {
  id: string;
  userId: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  downloadCount: number;
  isPublic: boolean; // true = 公开，false = 私有
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}

export const resourcesApi = {
  /**
   * 获取资料列表
   */
  getResources: async (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
  }): Promise<ApiResponse<{ resources: Resource[]; total: number }>> => {
    const response = await apiClient.get<ApiResponse<{ resources: Resource[]; total: number }>>(
      '/resources',
      { params }
    );
    return response.data;
  },

  /**
   * 获取资料详情
   */
  getResourceById: async (id: string): Promise<ApiResponse<Resource>> => {
    const response = await apiClient.get<ApiResponse<Resource>>(`/resources/${id}`);
    return response.data;
  },

  /**
   * 上传资料
   */
  uploadResource: async (data: {
    title: string;
    description?: string;
    file: File;
    isPrivate?: boolean;
  }): Promise<ApiResponse<Resource>> => {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    formData.append('file', data.file);
    // 后端使用 isPublic 字段（true = 公开，false = 私有）
    // 前端使用 isPrivate（true = 私有，false = 公开），需要转换
    const isPublic = !data.isPrivate; // isPrivate 的反值就是 isPublic
    formData.append('isPublic', String(isPublic));

    const response = await apiClient.post<ApiResponse<Resource>>('/resources', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * 下载资料
   */
  downloadResource: async (id: string): Promise<void> => {
    try {
      // 先获取资料信息，获取文件名
      const resourceResponse = await resourcesApi.getResourceById(id);
      if (!resourceResponse.success || !resourceResponse.data) {
        throw new Error('获取资料信息失败');
      }
      const resource = resourceResponse.data;
      const fileName = resource.fileName || 'resource';

      // 下载文件
      const response = await apiClient.post(`/resources/${id}/download`, {}, {
        responseType: 'blob',
      });

      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('下载失败:', error);
      throw error;
    }
  },

  /**
   * 删除资料
   */
  deleteResource: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(`/resources/${id}`);
    return response.data;
  },
};
