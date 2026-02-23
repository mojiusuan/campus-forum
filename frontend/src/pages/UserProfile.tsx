/**
 * 用户中心页面
 */
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users';
import { postsApi } from '../api/posts';
import { followApi } from '../api/follow';
import { useAuthStore } from '../store/authStore';
import { getFullUrl } from '../utils/url';
import { User, Mail, Calendar, MessageSquare, Eye, Heart, Edit } from 'lucide-react';
import PostImagePreview from '../components/PostImagePreview';
import Pagination from '../components/Pagination';
import { ListSkeleton } from '../components/LoadingSkeleton';
import type { Post } from '../types/api';

// 关注按钮组件
function FollowButton({ userId, isFollowing }: { userId: string; isFollowing: boolean }) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        return followApi.unfollowUser(userId);
      } else {
        return followApi.followUser(userId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      onClick={() => followMutation.mutate()}
      disabled={followMutation.isPending}
      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
    >
      {followMutation.isPending ? '处理中...' : isFollowing ? '取消关注' : '关注'}
    </button>
  );
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [currentPage, setCurrentPage] = useState(1);

  // 获取用户信息
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      if (!id) throw new Error('User ID is required');
      const response = await usersApi.getUserById(id);
      return response.data;
    },
    enabled: !!id,
  });

  // 获取用户的帖子
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['user-posts', id, currentPage],
    queryFn: async () => {
      if (!id) throw new Error('User ID is required');
      const response = await postsApi.getPosts({ 
        page: currentPage, 
        pageSize: 20,
        userId: id, // 使用后端API参数筛选
      });
      return response.data || { posts: [], total: 0, totalPages: 0 };
    },
    enabled: !!id,
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const user = userData;
  const posts = postsData?.posts || [];
  const totalPages = postsData?.totalPages || 1;
  const isOwnProfile = currentUser?.id === id;

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">用户不存在</p>
        <Link to="/" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 用户信息卡片 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start space-x-6">
          {/* 头像 */}
          <div className="flex-shrink-0">
            {user.avatarUrl ? (
              <img
                src={getFullUrl(user.avatarUrl) || ''}
                alt={user.username}
                className="w-24 h-24 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center">
                <User className="w-12 h-12 text-gray-600" />
              </div>
            )}
          </div>

          {/* 用户信息 */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
              {user.isVerified && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  已认证
                </span>
              )}
            </div>

            {user.bio && (
              <p className="text-gray-600 mb-4">{user.bio}</p>
            )}

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>注册于 {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* 统计数据 */}
            <div className="flex items-center space-x-6 mt-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user.postCount || 0}</div>
                <div className="text-sm text-gray-500">帖子</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user.followerCount || 0}</div>
                <div className="text-sm text-gray-500">粉丝</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user.followingCount || 0}</div>
                <div className="text-sm text-gray-500">关注</div>
              </div>
            </div>

            {/* 操作按钮 */}
            {isOwnProfile ? (
              <div className="mt-4">
                <button
                  onClick={() => navigate(`/users/${id}/edit`)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>编辑资料</span>
                </button>
              </div>
            ) : (
              <div className="mt-4 flex items-center space-x-2">
                <FollowButton userId={id!} isFollowing={user.isFollowing || false} />
                <Link
                  to={`/messages/${id}`}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  私信
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 帖子列表 */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">发布的帖子</h2>
        </div>

        {postsLoading ? (
          <div className="divide-y divide-gray-200">
            <ListSkeleton count={5} />
          </div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {isOwnProfile ? '你还没有发布过帖子' : '该用户还没有发布过帖子'}
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
            {posts.map((post: Post) => (
              <Link
                key={post.id}
                to={`/posts/${post.id}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{post.content}</p>
                {/* 图片预览 */}
                {post.images && post.images.length > 0 && (
                  <PostImagePreview images={post.images} postId={post.id} maxImages={3} />
                )}
                <div className="flex items-center space-x-6 text-sm text-gray-500 mt-3">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
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
              </Link>
            ))}
            </div>
            {totalPages > 1 && (
              <div className="p-6 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
