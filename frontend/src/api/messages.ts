/**
 * 私信相关 API
 */
import apiClient from './client';
import type { ApiResponse } from '../types/api';

export interface Conversation {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  lastMessage?: {
    content: string;
    createdAt: string;
    isRead: boolean;
  };
  unreadCount: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}

export const messagesApi = {
  /**
   * 获取对话列表
   */
  getConversations: async (): Promise<ApiResponse<{ conversations: Conversation[] }>> => {
    const response = await apiClient.get<ApiResponse<{ conversations: Conversation[] }>>(
      '/conversations'
    );
    return response.data;
  },

  /**
   * 获取对话详情
   */
  getConversation: async (userId: string): Promise<ApiResponse<{ messages: Message[] }>> => {
    const response = await apiClient.get<ApiResponse<{ messages: Message[] }>>(
      `/conversations/${userId}`
    );
    return response.data;
  },

  /**
   * 发送消息
   */
  sendMessage: async (
    userId: string,
    content: string
  ): Promise<ApiResponse<Message>> => {
    const response = await apiClient.post<ApiResponse<Message>>(
      `/conversations/${userId}/messages`,
      { content }
    );
    return response.data;
  },

  /**
   * 标记消息已读
   */
  markMessageAsRead: async (messageId: string): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>(`/messages/${messageId}/read`);
    return response.data;
  },

  /**
   * 获取未读消息数
   */
  getUnreadCount: async (): Promise<ApiResponse<{ unreadCount: number }>> => {
    const response = await apiClient.get<ApiResponse<{ unreadCount: number }>>(
      '/messages/unread-count'
    );
    return response.data;
  },
};
