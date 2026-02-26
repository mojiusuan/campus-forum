/**
 * 管理员用户详情页面
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/admin';
import { ListSkeleton } from '../../components/LoadingSkeleton';
import {
  ArrowLeft,
  Ban,
  CheckCircle,
  Shield,
  ShieldCheck,
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  FileText,
  MessageSquare,
  Key,
  Save,
} from 'lucide-react';
import { getFullUrl } from '../../utils/url';
import { useIsSuperAdmin } from '../../hooks/useAdmin';
import { Link } from 'react-router-dom';

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isSuperAdmin = useIsSuperAdmin();

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    username: '',
    email: '',
    role: '',
    isActive: true,
  });
  const [resetPasswordMode, setResetPasswordMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // 获取用户详情
  const { data: userDetailData, isLoading } = useQuery({
    queryKey: ['admin-user-detail', id],
    queryFn: async () => {
      const response = await adminApi.getUserById(id!);
      return response.data;
    },
    enabled: !!id,
  });

  // 更新用户信息
  const updateUserMutation = useMutation({
    mutationFn: (data: { username?: string; email?: string; role?: string; isActive?: boolean }) =>
      adminApi.updateUser(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditMode(false);
    },
  });

  // 重置密码
  const resetPasswordMutation = useMutation({
    mutationFn: (password: string) => adminApi.resetPassword(id!, password),
    onSuccess: () => {
      setResetPasswordMode(false);
      setNewPassword('');
      alert('密码已重置');
    },
  });

  // 封禁/解封用户
  const banUserMutation = useMutation({
    mutationFn: (reason?: string) => adminApi.banUser(id!, reason || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: () => adminApi.unbanUser(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <ListSkeleton count={5} />
        </div>
      </AdminLayout>
    );
  }

  if (!userDetailData?.user) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            <p>用户不存在</p>
            <Link
              to="/admin/users"
              className="mt-4 inline-flex items-center text-blue-600 hover:underline"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回用户列表
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const user = userDetailData.user;
  const recentPosts = userDetailData.recentPosts || [];
  const recentComments = userDetailData.recentComments || [];

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full flex items-center space-x-1">
            <ShieldCheck className="w-4 h-4" />
            <span>超级管理员</span>
          </span>
        );
      case 'admin':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full flex items-center space-x-1">
            <Shield className="w-4 h-4" />
            <span>管理员</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full flex items-center space-x-1">
            <UserIcon className="w-4 h-4" />
            <span>普通用户</span>
          </span>
        );
    }
  };

  const handleSave = () => {
    updateUserMutation.mutate(editData);
  };

  const handleResetPassword = () => {
    if (!newPassword || newPassword.length < 6) {
      alert('密码长度至少6位');
      return;
    }
    if (window.confirm('确定要重置该用户的密码吗？')) {
      resetPasswordMutation.mutate(newPassword);
    }
  };

  const handleBan = () => {
    const reason = window.prompt(`封禁用户: ${user.username}\n请输入封禁原因（可选）:`);
    if (reason !== null) {
      banUserMutation.mutate(reason);
    }
  };

  const handleUnban = () => {
    if (window.confirm(`确定要解封用户 ${user.username} 吗？`)) {
      unbanUserMutation.mutate();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/users')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">用户详情</h1>
              <p className="mt-1 text-sm text-gray-500">管理用户信息和权限</p>
            </div>
          </div>
        </div>

        {/* 用户基本信息 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              {user.avatarUrl ? (
                <img
                  src={getFullUrl(user.avatarUrl)}
                  alt={user.username}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                  <UserIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{user.username}</h2>
                {getRoleBadge(user.role)}
                {user.isVerified && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                    已验证
                  </span>
                )}
                {!user.isActive && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                    已封禁
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>注册时间: {new Date(user.createdAt).toLocaleString()}</span>
                </div>
                {user.lastLoginAt && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>最后登录: {new Date(user.lastLoginAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
              {user.bio && (
                <p className="mt-4 text-gray-600">{user.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* 统计数据 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">帖子数</p>
                <p className="text-2xl font-bold text-gray-900">{user.postCount || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">评论数</p>
                <p className="text-2xl font-bold text-gray-900">{user.commentCount || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <UserIcon className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">粉丝数</p>
                <p className="text-2xl font-bold text-gray-900">{user.followerCount || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <UserIcon className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-500">关注数</p>
                <p className="text-2xl font-bold text-gray-900">{user.followingCount || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 编辑用户信息 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">用户信息</h3>
            {!editMode ? (
              <button
                onClick={() => {
                  setEditMode(true);
                  setEditData({
                    username: user.username,
                    email: user.email,
                    role: user.role || 'user',
                    isActive: user.isActive,
                  });
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                编辑
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateUserMutation.isPending}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-1"
                >
                  <Save className="w-4 h-4" />
                  <span>保存</span>
                </button>
              </div>
            )}
          </div>
          {editMode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <input
                  type="text"
                  value={editData.username}
                  onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                <select
                  value={editData.role}
                  onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                  disabled={!isSuperAdmin && user.role === 'super_admin'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="user">普通用户</option>
                  <option value="admin">管理员</option>
                  {isSuperAdmin && <option value="super_admin">超级管理员</option>}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editData.isActive}
                  onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  账号激活
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-500">用户名</span>
                <span className="text-gray-900">{user.username}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-500">邮箱</span>
                <span className="text-gray-900">{user.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-500">角色</span>
                {getRoleBadge(user.role)}
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">账号状态</span>
                <span className={user.isActive ? 'text-green-600' : 'text-red-600'}>
                  {user.isActive ? '正常' : '已封禁'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">操作</h3>
          <div className="flex flex-wrap gap-3">
            {user.isActive ? (
              <button
                onClick={handleBan}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Ban className="w-4 h-4" />
                <span>封禁用户</span>
              </button>
            ) : (
              <button
                onClick={handleUnban}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>解封用户</span>
              </button>
            )}
            {!resetPasswordMode ? (
              <button
                onClick={() => setResetPasswordMode(true)}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors flex items-center space-x-2"
              >
                <Key className="w-4 h-4" />
                <span>重置密码</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="新密码（至少6位）"
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleResetPassword}
                  disabled={resetPasswordMutation.isPending}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                >
                  确认
                </button>
                <button
                  onClick={() => {
                    setResetPasswordMode(false);
                    setNewPassword('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 最近的帖子 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">最近的帖子</h3>
          {recentPosts.length === 0 ? (
            <p className="text-gray-500 text-sm">暂无帖子</p>
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post: any) => (
                <Link
                  key={post.id}
                  to={`/posts/${post.id}`}
                  className="block p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <h4 className="font-medium text-gray-900 mb-1">{post.title}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{new Date(post.createdAt).toLocaleString()}</span>
                    <span>浏览: {post.viewCount}</span>
                    <span>点赞: {post.likeCount}</span>
                    <span>评论: {post.commentCount}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 最近的评论 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">最近的评论</h3>
          {recentComments.length === 0 ? (
            <p className="text-gray-500 text-sm">暂无评论</p>
          ) : (
            <div className="space-y-3">
              {recentComments.map((comment: any) => (
                <div
                  key={comment.id}
                  className="p-3 border border-gray-200 rounded-md"
                >
                  <p className="text-gray-900 mb-2">{comment.content}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <Link
                      to={`/posts/${comment.postId}`}
                      className="hover:text-blue-600"
                    >
                      {comment.post?.title}
                    </Link>
                    <span>{new Date(comment.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
