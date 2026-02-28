/**
 * 管理员用户管理页面
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/admin';
import Pagination from '../../components/Pagination';
import { ListSkeleton } from '../../components/LoadingSkeleton';
import { Search, Ban, CheckCircle, Shield, ShieldCheck, User as UserIcon, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { getFullUrl } from '../../utils/url';
import { useIsSuperAdmin } from '../../hooks/useAdmin';
import type { User } from '../../types/api';

type AdminUser = User & {
  verificationStatus?: string;
  studentIdImageUrl?: string;
};

export default function AdminUsers() {
  const isSuperAdmin = useIsSuperAdmin();
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 20,
    keyword: '',
    role: 'all',
    status: 'all',
    verificationStatus: 'all' as string, // 'all' | 'pending' | 'approved' | 'rejected'
  });

  const queryClient = useQueryClient();

  // 获取用户列表
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', searchParams],
    queryFn: async () => {
      const response = await adminApi.getUsers({
        page: searchParams.page,
        limit: searchParams.limit,
        keyword: searchParams.keyword || undefined,
        role: searchParams.role === 'all' ? undefined : searchParams.role,
        status: searchParams.status === 'all' ? undefined : searchParams.status,
        verificationStatus: searchParams.verificationStatus === 'all' ? undefined : searchParams.verificationStatus,
      });
      return response.data;
    },
  });

  // 封禁用户
  const banUserMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      adminApi.banUser(id, reason || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  // 解封用户
  const unbanUserMutation = useMutation({
    mutationFn: (id: string) => adminApi.unbanUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  // 通过注册审核
  const approveUserMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  // 拒绝注册审核
  const rejectUserMutation = useMutation({
    mutationFn: (id: string) => adminApi.rejectUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => ({ ...prev, page: 1 }));
  };

  const handleBan = async (user: User) => {
    const reason = window.prompt(`封禁用户: ${user.username}\n请输入封禁原因（可选）:`);
    if (reason !== null) {
      await banUserMutation.mutateAsync({ id: user.id!, reason });
    }
  };

  const handleUnban = async (user: User) => {
    if (window.confirm(`确定要解封用户 ${user.username} 吗？`)) {
      await unbanUserMutation.mutateAsync(user.id!);
    }
  };

  const handleApprove = async (user: AdminUser) => {
    if (window.confirm(`确定通过用户 ${user.username} 的注册审核吗？`)) {
      await approveUserMutation.mutateAsync(user.id!);
    }
  };

  const handleReject = async (user: AdminUser) => {
    if (window.confirm(`确定拒绝用户 ${user.username} 的注册审核吗？`)) {
      await rejectUserMutation.mutateAsync(user.id!);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3" />
            <span>超级管理员</span>
          </span>
        );
      case 'admin':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded flex items-center space-x-1">
            <Shield className="w-3 h-3" />
            <span>管理员</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded flex items-center space-x-1">
            <UserIcon className="w-3 h-3" />
            <span>普通用户</span>
          </span>
        );
    }
  };

  const getVerificationBadge = (status?: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>待审核</span>
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>已通过</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded flex items-center space-x-1">
            <XCircle className="w-3 h-3" />
            <span>已拒绝</span>
          </span>
        );
      default:
        return null;
    }
  };

  const users: AdminUser[] = usersData?.users || [];
  const totalPages = usersData?.pagination?.totalPages || 1;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理所有用户账号</p>
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
                    placeholder="搜索用户名或邮箱..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <select
                  value={searchParams.role}
                  onChange={(e) =>
                    setSearchParams((prev) => ({ ...prev, role: e.target.value, page: 1 }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">所有角色</option>
                  <option value="user">普通用户</option>
                  <option value="admin">管理员</option>
                  {isSuperAdmin && <option value="super_admin">超级管理员</option>}
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
                  <option value="banned">已封禁</option>
                </select>
              </div>
              <div>
                <select
                  value={searchParams.verificationStatus}
                  onChange={(e) =>
                    setSearchParams((prev) => ({ ...prev, verificationStatus: e.target.value, page: 1 }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">审核状态</option>
                  <option value="pending">待审核</option>
                  <option value="approved">已通过</option>
                  <option value="rejected">已拒绝</option>
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

        {/* 用户列表 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="divide-y divide-gray-200">
              <ListSkeleton count={5} />
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>没有找到用户</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {users.map((user: User & { postCount?: number; commentCount?: number }) => (
                  <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {user.avatarUrl ? (
                            <img
                              src={getFullUrl(user.avatarUrl)}
                              alt={user.username}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Link
                              to={`/admin/users/${user.id}`}
                              className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                            >
                              {user.username}
                            </Link>
                            {getRoleBadge(user.role)}
                            {getVerificationBadge(user.verificationStatus)}
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
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                          {user.bio && (
                            <p className="text-sm text-gray-600 mt-1 truncate">{user.bio}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>帖子: {user.postCount || 0}</span>
                            <span>评论: {user.commentCount || 0}</span>
                            {user.lastLoginAt && (
                              <span>
                                最后登录: {new Date(user.lastLoginAt).toLocaleString()}
                              </span>
                            )}
                            {user.verificationStatus === 'pending' && user.studentIdImageUrl && (
                              <a
                                href={getFullUrl(user.studentIdImageUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                查看学生证
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex items-center space-x-2">
                        {user.verificationStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(user)}
                              disabled={approveUserMutation.isPending}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                              title="通过审核"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleReject(user)}
                              disabled={rejectUserMutation.isPending}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="拒绝审核"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        {user.isActive ? (
                          <button
                            onClick={() => handleBan(user)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="封禁"
                          >
                            <Ban className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnban(user)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                            title="解封"
                          >
                            <CheckCircle className="w-5 h-5" />
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
