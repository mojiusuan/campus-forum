/**
 * 管理员数据统计页面
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
  AreaChart,
  Area,
} from 'recharts';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/admin';
import { Download, TrendingUp, Users, FileText, MessageSquare } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

export default function AdminStats() {
  const [userPeriod, setUserPeriod] = useState<'7d' | '30d' | 'all'>('30d');
  const [postPeriod, setPostPeriod] = useState<'7d' | '30d' | 'all'>('30d');

  // 获取概览统计
  const { data: stats } = useQuery({
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

  // 导出数据为CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) => headers.map((header) => row[header]).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">数据统计</h1>
            <p className="mt-1 text-sm text-gray-500">查看详细数据统计和趋势分析</p>
          </div>
        </div>

        {/* 关键指标 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">用户总数</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {overview.totalUsers || 0}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  活跃用户: {overview.activeUsers || 0}
                </p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">帖子总数</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {overview.totalPosts || 0}
                </p>
                <p className="mt-1 text-sm text-gray-500">今日新增: {overview.todayPosts || 0}</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">评论总数</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {overview.totalComments || 0}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  今日新增: {overview.todayComments || 0}
                </p>
              </div>
              <div className="bg-yellow-500 p-3 rounded-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">分类数量</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {overview.totalCategories || 0}
                </p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* 用户增长趋势 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">用户增长趋势</h2>
            <div className="flex items-center space-x-3">
              <select
                value={userPeriod}
                onChange={(e) => setUserPeriod(e.target.value as '7d' | '30d' | 'all')}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">最近7天</option>
                <option value="30d">最近30天</option>
                <option value="all">全部</option>
              </select>
              <button
                onClick={() => exportToCSV(userTrends, `用户增长趋势_${userPeriod}.csv`)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>导出</span>
              </button>
            </div>
          </div>
          {userStatsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">加载中...</div>
            </div>
          ) : userTrends.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">暂无数据</div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={userTrends}>
                <defs>
                  <linearGradient id="colorUser" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  style={{ fontSize: '12px' }}
                />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip
                  labelFormatter={(label) => `日期: ${label}`}
                  formatter={(value: number) => [value, '注册用户数']}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorUser)"
                  name="注册用户"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 帖子发布趋势 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">帖子发布趋势</h2>
            <div className="flex items-center space-x-3">
              <select
                value={postPeriod}
                onChange={(e) => setPostPeriod(e.target.value as '7d' | '30d' | 'all')}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">最近7天</option>
                <option value="30d">最近30天</option>
                <option value="all">全部</option>
              </select>
              <button
                onClick={() => exportToCSV(postTrends, `帖子发布趋势_${postPeriod}.csv`)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>导出</span>
              </button>
            </div>
          </div>
          {postStatsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">加载中...</div>
            </div>
          ) : postTrends.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">暂无数据</div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
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
                  formatter={(value: number) => [value, '发布帖子数']}
                />
                <Legend />
                <Bar dataKey="count" fill="#10b981" name="发布帖子" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 分类分布 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">分类分布（饼图）</h2>
              <button
                onClick={() => exportToCSV(categoryData, '分类分布.csv')}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>导出</span>
              </button>
            </div>
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

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">分类分布（柱状图）</h2>
            </div>
            {categoryStatsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">加载中...</div>
              </div>
            ) : categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-gray-500">暂无数据</div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" style={{ fontSize: '12px' }} />
                  <YAxis style={{ fontSize: '12px' }} />
                  <Tooltip formatter={(value: number) => [value, '帖子数']} />
                  <Legend />
                  <Bar dataKey="postCount" fill="#8b5cf6" name="帖子数" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 数据汇总表格 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">分类数据汇总</h2>
          {categoryStatsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">加载中...</div>
            </div>
          ) : categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">暂无数据</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      分类名称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      标识
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      帖子数量
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      占比
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categoryData.map((category: any) => {
                    const totalPosts = categoryData.reduce(
                      (sum: number, cat: any) => sum + cat.postCount,
                      0
                    );
                    const percentage =
                      totalPosts > 0 ? ((category.postCount / totalPosts) * 100).toFixed(1) : 0;
                    return (
                      <tr key={category.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {category.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {category.slug}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {category.postCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {percentage}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
