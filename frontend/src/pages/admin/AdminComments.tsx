/**
 * 管理员评论管理页面
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/admin';
import Pagination from '../../components/Pagination';
import { ListSkeleton } from '../../components/LoadingSkeleton';
import { Search, Trash2, RotateCcw, MessageSquare, User, FileText } from 'lucide-react';
import { getFullUrl } from '../../utils/url';
import type { Comment } from '../../types/api';

export default function AdminComments() {
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 20,
    keyword: '',
    postId: '',
    userId: '',
    status: 'all', // 'all' | 'active' | 'deleted'
  });

  const queryClient = useQueryClient();

  // 获取评论列表
  const { data: commentsData, isLoading } = useQuery({
    queryKey: ['admin-comments', searchParams],
    queryFn: async () => {
      const response = await adminApi.getComments({
        page: searchParams.page,
        limit: searchParams.limit,
        keyword: searchParams.keyword || undefined,
        postId: searchParams.postId || undefined,
        userId: searchParams.userId || undefined,
        status: searchParams.status === 'all' ? undefined : searchParams.status,
      });
      return response.data;
    },
  });

  // 删除评论
  const deleteCommentMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
    },
  });

  // 恢复评论
  const restoreCommentMutation = useMutation({
    mutationFn: (id: string) => adminApi.restoreComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (id: string, content: string) => {
    if (window.confirm(`确定要删除这条评论吗？\n内容: ${content.substring(0, 50)}...\n此操作不可恢复！`)) {
      await deleteCommentMutation.mutateAsync(id);
    }
  };

  const comments = commentsData?.comments || [];
  const totalPages = commentsData?.pagination?.totalPages || 1;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">评论管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理所有评论内容</p>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchParams.keyword}
                    onChange={(e) =>
                      setSearchParams((prev) => ({ ...prev, keyword: e.target.value }))
                    }
                    placeholder="搜索评论内容..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <input
                  type="text"
                  value={searchParams.postId}
                  onChange={(e) =>
                    setSearchParams((prev) => ({ ...prev, postId: e.target.value, page: 1 }))
                  }
                  placeholder="帖子ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <select
                  value={searchParams.status}
                  onChange={(e) =>
                    setSearchParams((prev) => ({ ...prev, status: e.target.value, page: 1 }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">全部状态</option>
                  <option value="active">正常</option>
                  <option value="deleted">已删除</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                搜索
              </button>
            </div>
          </form>
        </div>

        {/* 评论列表 */}
        <div className="bg-white rounded-lg shadow-sm">
          {isLoading ? (
            <div className="divide-y divide-gray-200">
              <ListSkeleton count={5} />
            </div>
          ) : comments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>没有找到评论</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {comments.map((comment: Comment & { post?: { id: string; title: string } }) => (
                  <div key={comment.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          {comment.isDeleted && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                              已删除
                            </span>
                          )}
                          {comment.parentId && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              回复
                            </span>
                          )}
                        </div>
                        <p className="text-gray-900 mb-3">{comment.content}</p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <Link
                              to={`/users/${comment.userId}`}
                              className="hover:text-blue-600"
                            >
                              {comment.user?.username || '匿名'}
                            </Link>
                          </div>
                          {comment.post && (
                            <div className="flex items-center space-x-1">
                              <FileText className="w-4 h-4" />
                              <Link
                                to={`/posts/${comment.post.id}`}
                                className="hover:text-blue-600"
                              >
                                {comment.post.title}
                              </Link>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="w-4 h-4" />
                            <span>{comment.likeCount} 点赞</span>
                          </div>
                          <span>发布时间: {new Date(comment.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex items-start space-x-2">
                        {comment.isDeleted ? (
                          <button
                            onClick={() => restoreCommentMutation.mutate(comment.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                            title="恢复"
                          >
                            <RotateCcw className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDelete(comment.id, comment.content)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="p-6 border-t border-gray-200">
                  <Pagination
                    currentPage={searchParams.page}
                    totalPages={totalPages}
                    onPageChange={(page) =>
                      setSearchParams((prev) => ({ ...prev, page }))
                    }
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
