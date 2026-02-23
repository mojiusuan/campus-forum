/**
 * 对话详情页面
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../api/messages';
import { usersApi } from '../api/users';
import { useAuthStore } from '../store/authStore';
import { getFullUrl } from '../utils/url';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, User } from 'lucide-react';
import type { Message } from '../api/messages';

export default function Conversation() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [messageContent, setMessageContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 获取用户信息
  const { data: userData } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const response = await usersApi.getUserById(userId);
      return response.data;
    },
    enabled: !!userId,
  });

  // 获取消息列表
  const { data: messagesData } = useQuery({
    queryKey: ['conversation', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const response = await messagesApi.getConversation(userId);
      return response.data?.messages || [];
    },
    enabled: !!userId,
    refetchInterval: 3000, // 每3秒刷新一次
  });

  // 发送消息
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!userId) throw new Error('User ID is required');
      return messagesApi.sendMessage(userId, content);
    },
    onSuccess: () => {
      setMessageContent('');
      queryClient.invalidateQueries({ queryKey: ['conversation', userId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // 标记消息已读
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return messagesApi.markMessageAsRead(messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', userId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData]);

  // 标记未读消息为已读
  useEffect(() => {
    if (messagesData && currentUser) {
      messagesData.forEach((message: Message) => {
        if (
          message.receiverId === currentUser.id &&
          !message.isRead
        ) {
          markAsReadMutation.mutate(message.id);
        }
      });
    }
  }, [messagesData, currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !userId) return;
    sendMessageMutation.mutate(messageContent);
  };

  const messages = (messagesData || []) as Message[];
  const user = userData;

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-200px)]">
      {/* 头部 */}
      <div className="bg-white rounded-t-lg shadow-sm p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/messages')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          {user?.avatarUrl ? (
            <img
              src={getFullUrl(user.avatarUrl) || ''}
              alt={user.username}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <User className="w-6 h-6 text-gray-600" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{user?.username || '用户'}</h2>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 bg-gray-50 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>还没有消息，开始对话吧</p>
          </div>
        ) : (
          messages.map((message: Message) => {
            const isOwn = message.senderId === currentUser?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwn
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  {!isOwn && message.sender && (
                    <p className="text-xs font-medium mb-1 opacity-70">
                      {message.sender.username}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="bg-white rounded-b-lg shadow-sm p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder="输入消息..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!messageContent.trim() || sendMessageMutation.isPending}
            className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
