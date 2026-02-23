/**
 * 通知相关 API
 */
import apiClient from './client';
import type { ApiResponse } from '../types/api';

export interface Notification {
  id: string;
  type: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
  relatedType?: string;
}

export const notificationsApi = {
  /**
   * 获取通知列表
   */
  getNotifications: async (params?: {
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<{ notifications: Notification[]; total: number }>> => {
    const response = await apiClient.get<ApiResponse<{ notifications: Notification[]; total: number }>>(
      '/notifications',
      { params }
    );
    return response.data;
  },

  /**
   * 标记通知已读
   */
  markAsRead: async (notificationId: string): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * 标记所有通知已读
   */
  markAllAsRead: async (): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>('/notifications/read-all');
    return response.data;
  },

  /**
   * 获取未读通知数
   */
  getUnreadCount: async (): Promise<ApiResponse<{ unreadCount: number }>> => {
    const response = await apiClient.get<ApiResponse<{ unreadCount: number }>>(
      '/notifications/unread-count'
    );
    return response.data;
  },
};
