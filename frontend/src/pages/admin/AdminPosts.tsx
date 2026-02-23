/**
 * 管理员帖子管理页面
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/admin';
import { categoriesApi } from '../../api/categories';
import Pagination from '../../components/Pagination';
import { ListSkeleton } from '../../components/LoadingSkeleton';
import { Search, Trash2, RotateCcw, Pin, PinOff, Lock, Unlock, Eye, MessageSquare, Heart } from 'lucide-react';
import { getFullUrl } from '../../utils/url';
import type { Post, Category } from '../../types/api';

export default function AdminPosts() {
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 20,
    keyword: '',
    categoryId: '',
    userId: '',
    status: 'all', // 'all' | 'active' | 'deleted' | 'pinned' | 'locked'
  });

  const queryClient = useQueryClient();

  // 获取分类列表
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesApi.getCategories();
      return response.data?.categories || [];
    },
  });

  // 获取帖子列表
  const { data: postsData, isLoading } = useQuery({
    queryKey: ['admin-posts', searchParams],
    queryFn: async () => {
      const response = await adminApi.getPosts({
        page: searchParams.page,
        pageSize: searchParams.limit,
        keyword: searchParams.keyword || undefined,
        categoryId: searchParams.categoryId || undefined,
        userId: searchParams.userId || undefined,
        status: searchParams.status === 'all' ? undefined : searchParams.status,
      });
      return response.data;
    },
  });

  // 删除帖子
  const deletePostMutation = useMutation({
    mutationFn: (id: string) => adminApi.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    },
  });

  // 恢复帖子
  const restorePostMutation = useMutation({
    mutationFn: (id: string) => adminApi.restorePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    },
  });

  // 置顶/取消置顶
  const pinPostMutation = useMutation({
    mutationFn: ({ id, pin }: { id: string; pin: boolean }) =>
      pin ? adminApi.pinPost(id) : adminApi.unpinPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    },
  });

  // 锁定/解锁
  const lockPostMutation = useMutation({
    mutationFn: ({ id, lock }: { id: string; lock: boolean }) =>
      lock ? adminApi.lockPost(id) : adminApi.unlockPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`确定要删除帖子"${title}"吗？此操作不可恢复！`)) {
      await deletePostMutation.mutateAsync(id);
    }
  };

  const categories = (categoriesData || []) as Category[];
  const posts = postsData?.posts || [];
  const totalPages = postsData?.pagination?.totalPages || 1;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">帖子管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理所有帖子内容</p>
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
                    placeholder="搜索帖子标题或内容..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <select
                  value={searchParams.categoryId}
                  onChange={(e) =>
                    setSearchParams((prev) => ({ ...prev, categoryId: e.target.value, page: 1 }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">全部分类</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
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
                  <option value="pinned">已置顶</option>
                  <option value="locked">已锁定</option>
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

        {/* 帖子列表 */}
        <div className="bg-white rounded-lg shadow-sm">
          {isLoading ? (
            <div className="divide-y divide-gray-200">
              <ListSkeleton count={5} />
            </div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>没有找到帖子</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {posts.map((post: Post) => (
                  <div key={post.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          {post.isDeleted && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                              已删除
                            </span>
                          )}
                          {post.isPinned && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                              置顶
                            </span>
                          )}
                          {post.isLocked && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              锁定
                            </span>
                          )}
                          {post.category && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              {post.category.name}
                            </span>
                          )}
                        </div>
                        <Link
                          to={`/posts/${post.id}`}
                          className="block group"
                        >
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                            {post.title}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {post.content}
                          </p>
                        </Link>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span>作者: {post.user?.username || '匿名'}</span>
                          <span>发布时间: {new Date(post.createdAt).toLocaleString()}</span>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                            <span>{post.viewCount}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="w-4 h-4" />
                            <span>{post.commentCount}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="w-4 h-4" />
                            <span>{post.likeCount}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex items-start space-x-2">
                        {post.isDeleted ? (
                          <button
                            onClick={() => restorePostMutation.mutate(post.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                            title="恢复"
                          >
                            <RotateCcw className="w-5 h-5" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() =>
                                pinPostMutation.mutate({ id: post.id, pin: !post.isPinned })
                              }
                              className={`p-2 rounded-md transition-colors ${
                                post.isPinned
                                  ? 'text-yellow-600 hover:bg-yellow-50'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                              title={post.isPinned ? '取消置顶' : '置顶'}
                            >
                              {post.isPinned ? <PinOff className="w-5 h-5" /> : <Pin className="w-5 h-5" />}
                            </button>
                            <button
                              onClick={() =>
                                lockPostMutation.mutate({ id: post.id, lock: !post.isLocked })
                              }
                              className={`p-2 rounded-md transition-colors ${
                                post.isLocked
                                  ? 'text-red-600 hover:bg-red-50'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                              title={post.isLocked ? '解锁' : '锁定'}
                            >
                              {post.isLocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
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
