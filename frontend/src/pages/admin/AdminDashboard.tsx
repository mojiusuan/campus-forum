/**
 * 管理员数据概览页面
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/admin';
import { Users, FileText, MessageSquare, TrendingUp, RefreshCw } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function AdminDashboard() {
  const [userPeriod, setUserPeriod] = useState<'7d' | '30d' | 'all'>('30d');
  const [postPeriod, setPostPeriod] = useState<'7d' | '30d' | 'all'>('30d');

  // 获取概览统计
  const { data: stats, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ['admin-stats-overview'],
    queryFn: () => adminApi.getOverviewStats(),
  });

  // 获取用户统计
  const { data: userStats, isLoading: userStatsLoading } = useQuery({
    queryKey: ['admin-stats-users', userPeriod],
    queryFn: () => adminApi.getUserStats(userPeriod),
  });

  // 获取帖子统计
  const { data: postStats, isLoading: postStatsLoading } = useQuery({
    queryKey: ['admin-stats-posts', postPeriod],
    queryFn: () => adminApi.getPostStats(postPeriod),
  });

  // 获取分类统计
  const { data: categoryStats, isLoading: categoryStatsLoading } = useQuery({
    queryKey: ['admin-stats-categories'],
    queryFn: () => adminApi.getCategoryStats(),
  });

  const overview = stats?.data || {};
  const userTrends = userStats?.data?.trends || [];
  const postTrends = postStats?.data?.trends || [];
  const categoryData = categoryStats?.data?.categories || [];

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const statCards = [
    {
      title: '用户总数',
      value: overview.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500',
      change: overview.activeUsers || 0,
      changeLabel: '活跃用户',
    },
    {
      title: '帖子总数',
      value: overview.totalPosts || 0,
      icon: FileText,
      color: 'bg-green-500',
      change: overview.todayPosts || 0,
      changeLabel: '今日新增',
    },
    {
      title: '评论总数',
      value: overview.totalComments || 0,
      icon: MessageSquare,
      color: 'bg-yellow-500',
      change: overview.todayComments || 0,
      changeLabel: '今日新增',
    },
    {
      title: '分类数量',
      value: overview.totalCategories || 0,
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: null,
      changeLabel: null,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">数据概览</h1>
            <p className="mt-1 text-sm text-gray-500">平台整体数据统计</p>
          </div>
          <button
            onClick={() => refetchOverview()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>刷新</span>
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{card.value}</p>
                    {card.change !== null && (
                      <p className="mt-1 text-sm text-gray-500">
                        {card.changeLabel}: {card.change}
                      </p>
                    )}
                  </div>
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 用户增长趋势图 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">用户增长趋势</h2>
              <select
                value={userPeriod}
                onChange={(e) => setUserPeriod(e.target.value as '7d' | '30d' | 'all')}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">最近7天</option>
                <option value="30d">最近30天</option>
                <option value="all">全部</option>
              </select>
            </div>
            {userStatsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">加载中...</div>
              </div>
            ) : userTrends.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-gray-500">
                暂无数据
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis style={{ fontSize: '12px' }} />
                  <Tooltip
                    labelFormatter={(label) => `日期: ${label}`}
                    formatter={(value: number) => [value, '用户数']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="注册用户"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 帖子发布趋势图 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">帖子发布趋势</h2>
              <select
                value={postPeriod}
                onChange={(e) => setPostPeriod(e.target.value as '7d' | '30d' | 'all')}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">最近7天</option>
                <option value="30d">最近30天</option>
                <option value="all">全部</option>
              </select>
            </div>
            {postStatsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">加载中...</div>
              </div>
            ) : postTrends.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-gray-500">
                暂无数据
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={postTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis style={{ fontSize: '12px' }} />
                  <Tooltip
                    labelFormatter={(label) => `日期: ${label}`}
                    formatter={(value: number) => [value, '帖子数']}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#10b981" name="发布帖子" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 分类分布饼图 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">分类分布</h2>
          {categoryStatsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">加载中...</div>
            </div>
          ) : categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">暂无数据</div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="postCount"
                >
                  {categoryData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, '帖子数']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 快速操作 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/posts"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900">管理帖子</h3>
              <p className="mt-1 text-sm text-gray-500">查看和管理所有帖子</p>
            </a>
            <a
              href="/admin/users"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900">管理用户</h3>
              <p className="mt-1 text-sm text-gray-500">查看和管理用户账号</p>
            </a>
            <a
              href="/admin/categories"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900">管理分类</h3>
              <p className="mt-1 text-sm text-gray-500">添加和编辑分类</p>
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
