import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Flame, Eye, FileText } from 'lucide-react';
import { postsApi } from '../api/posts';

export default function HotWeekly() {
  const { data, isLoading } = useQuery({
    queryKey: ['posts', 'weekly-hot', 'page'],
    queryFn: async () => {
      const response = await postsApi.getWeeklyHotPosts(30);
      return response.data;
    },
  });

  const posts = data?.posts || [];
  const stats = data?.stats;
  const maxViews = useMemo(
    () => Math.max(...(stats?.trend?.map((item) => item.views) || [1])),
    [stats?.trend]
  );

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h1 className="text-xl font-bold text-gray-900">每周热榜</h1>
        </div>
        <p className="text-sm text-gray-500">滚动统计最近 7 天内发布帖子的热度（按浏览量排序）。</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500">7天发帖数</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalPosts ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500">7天累计浏览</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalViews ?? 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">7天趋势</h2>
        <div className="space-y-2">
          {(stats?.trend || []).map((item) => (
            <div key={item.date} className="grid grid-cols-[74px_1fr_72px] items-center gap-2">
              <span className="text-xs text-gray-500">{item.date.slice(5)}</span>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-orange-500"
                  style={{ width: `${Math.max((item.views / maxViews) * 100, 2)}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 text-right">{item.views} 浏览</span>
            </div>
          ))}
          {!stats?.trend?.length && <p className="text-xs text-gray-500">暂无统计数据</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">热榜帖子</h2>
        </div>
        {isLoading ? (
          <div className="p-4 text-sm text-gray-500">加载中...</div>
        ) : posts.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">最近 7 天暂无热门帖子</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {posts.map((post, index) => (
              <Link
                key={post.id}
                to={`/posts/${post.id}`}
                className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-bold text-orange-500 w-6 text-center">#{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900 line-clamp-1">{post.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {post.viewCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {post.category?.name || '未分类'}
                    </span>
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
