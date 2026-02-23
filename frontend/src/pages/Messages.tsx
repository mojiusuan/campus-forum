/**
 * 私信列表页面
 */
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { messagesApi } from '../api/messages';
import { getFullUrl } from '../utils/url';
import { User, MessageSquare } from 'lucide-react';
import type { Conversation } from '../api/messages';

export default function Messages() {
  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await messagesApi.getConversations();
      return response.data?.conversations || [];
    },
  });

  const conversations = (data || []) as Conversation[];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">私信</h1>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>暂无私信</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {conversations.map((conversation) => (
              <Link
                key={conversation.id}
                to={`/messages/${conversation.userId}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {conversation.avatarUrl ? (
                    <img
                      src={getFullUrl(conversation.avatarUrl) || ''}
                      alt={conversation.username}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {conversation.username}
                      </h3>
                      {conversation.unreadCount > 0 && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    {conversation.lastMessage && (
                      <>
                        <p className="text-sm text-gray-600 truncate mb-1">
                          {conversation.lastMessage.content}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(conversation.lastMessage.createdAt).toLocaleString()}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
