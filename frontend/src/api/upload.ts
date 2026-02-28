/**
 * 文件上传相关 API
 */
import apiClient from './client';
import type { ApiResponse } from '../types/api';

export interface UploadImageResponse {
  url: string;
}

export interface UploadFileResponse {
  url: string;
  filename: string;
  size: number;
}

export const uploadApi = {
  /**
   * 上传学生证照片（无需登录，供注册使用）
   */
  uploadStudentId: async (formData: FormData): Promise<ApiResponse<{ url: string }>> => {
    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      '/upload/student-id',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * 上传图片
   */
  uploadImage: async (formData: FormData): Promise<ApiResponse<UploadImageResponse>> => {
    const response = await apiClient.post<ApiResponse<UploadImageResponse>>(
      '/upload/image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * 上传文件
   */
  uploadFile: async (formData: FormData): Promise<ApiResponse<UploadFileResponse>> => {
    const response = await apiClient.post<ApiResponse<UploadFileResponse>>(
      '/upload/file',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};
