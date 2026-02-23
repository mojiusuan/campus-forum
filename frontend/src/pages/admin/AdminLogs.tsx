/**
 * 管理员操作日志页面
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/admin';
import Pagination from '../../components/Pagination';
import { ListSkeleton } from '../../components/LoadingSkeleton';
import { Search, Filter, Calendar, User, Activity } from 'lucide-react';

interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  admin?: {
    id: string;
    username: string;
    email: string;
  };
}

const ACTION_LABELS: Record<string, string> = {
  delete_post: '删除帖子',
  restore_post: '恢复帖子',
  pin_post: '置顶帖子',
  unpin_post: '取消置顶',
  lock_post: '锁定帖子',
  unlock_post: '解锁帖子',
  delete_comment: '删除评论',
  restore_comment: '恢复评论',
  ban_user: '封禁用户',
  unban_user: '解封用户',
  update_user: '更新用户',
  reset_password: '重置密码',
  create_category: '创建分类',
  update_category: '更新分类',
  delete_category: '删除分类',
  reorder_categories: '调整分类顺序',
  delete_resource: '删除学习资料',
  restore_resource: '恢复学习资料',
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  post: '帖子',
  user: '用户',
  comment: '评论',
  category: '分类',
  resource: '学习资料',
};

export default function AdminLogs() {
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 20,
    adminId: '',
    action: 'all',
    targetType: 'all',
    startDate: '',
    endDate: '',
  });

  // 获取操作日志列表
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['admin-logs', searchParams],
    queryFn: async () => {
      const response = await adminApi.getLogs({
        page: searchParams.page,
        limit: searchParams.limit,
        adminId: searchParams.adminId || undefined,
        action: searchParams.action === 'all' ? undefined : searchParams.action,
        targetType: searchParams.targetType === 'all' ? undefined : searchParams.targetType,
        startDate: searchParams.startDate || undefined,
        endDate: searchParams.endDate || undefined,
      });
      return response.data;
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => ({ ...prev, page: 1 }));
  };

  const handleReset = () => {
    setSearchParams({
      page: 1,
      limit: 20,
      adminId: '',
      action: 'all',
      targetType: 'all',
      startDate: '',
      endDate: '',
    });
  };

  const logs = logsData?.logs || [];
  const totalPages = logsData?.pagination?.totalPages || 1;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">操作日志</h1>
          <p className="mt-1 text-sm text-gray-500">查看所有管理员操作记录</p>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">操作类型</label>
                <select
                  value={searchParams.action}
                  onChange={(e) =>
                    setSearchParams((prev) => ({ ...prev, action: e.target.value, page: 1 }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">全部操作</option>
                  {Object.entries(ACTION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">目标类型</label>
                <select
                  value={searchParams.targetType}
                  onChange={(e) =>
                    setSearchParams((prev) => ({ ...prev, targetType: e.target.value, page: 1 }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">全部类型</option>
                  {Object.entries(TARGET_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">管理员ID</label>
                <input
                  type="text"
                  value={searchParams.adminId}
                  onChange={(e) =>
                    setSearchParams((prev) => ({ ...prev, adminId: e.target.value, page: 1 }))
                  }
                  placeholder="输入管理员ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                <input
                  type="date"
                  value={searchParams.startDate}
                  onChange={(e) =>
                    setSearchParams((prev) => ({ ...prev, startDate: e.target.value, page: 1 }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                <input
                  type="date"
                  value={searchParams.endDate}
                  onChange={(e) =>
                    setSearchParams((prev) => ({ ...prev, endDate: e.target.value, page: 1 }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>重置</span>
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>搜索</span>
              </button>
            </div>
          </form>
        </div>

        {/* 日志列表 */}
        <div className="bg-white rounded-lg shadow-sm">
          {isLoading ? (
            <div className="divide-y divide-gray-200">
              <ListSkeleton count={5} />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>没有找到操作日志</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {logs.map((log: AdminLog) => (
                  <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <Activity className="w-4 h-4 text-blue-600" />
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                          {log.targetType && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {TARGET_TYPE_LABELS[log.targetType] || log.targetType}
                            </span>
                          )}
                        </div>
                        {log.description && (
                          <p className="text-gray-900 mb-2">{log.description}</p>
                        )}
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>
                              {log.admin?.username || '未知'} ({log.admin?.email || log.adminId})
                            </span>
                          </div>
                          {log.targetId && (
                            <span className="text-xs">目标ID: {log.targetId}</span>
                          )}
                          {log.ipAddress && (
                            <span className="text-xs">IP: {log.ipAddress}</span>
                          )}
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(log.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                        {log.userAgent && (
                          <p className="mt-2 text-xs text-gray-400 truncate">
                            {log.userAgent}
                          </p>
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
