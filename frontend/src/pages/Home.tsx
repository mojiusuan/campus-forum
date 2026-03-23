/**
 * 首页 - 帖子列表
 */
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { postsApi } from '../api/posts';
import { categoriesApi } from '../api/categories';
import { MessageSquare, Eye, Heart, Clock, Plus } from 'lucide-react';
import PostImagePreview from '../components/PostImagePreview';
import Pagination from '../components/Pagination';
import { ListSkeleton } from '../components/LoadingSkeleton';
import { getFullUrl } from '../utils/url';
import type { Post, Category } from '../types/api';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryId = searchParams.get('category') || undefined;
  const currentPage = parseInt(searchParams.get('page') || '1');

  // 处理分类点击，清除页码参数
  const handleCategoryClick = (newCategoryId: string | null) => {
    const params = new URLSearchParams();
    if (newCategoryId) {
      params.set('category', newCategoryId);
    }
    // 不设置page参数，默认为第1页
    setSearchParams(params, { replace: true });
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesApi.getCategories();
      return response.data?.categories || [];
    },
  });

  const { data: postsData, isLoading } = useQuery({
    queryKey: ['posts', 'latest', currentPage, categoryId],
    queryFn: async () => {
      const response = await postsApi.getPosts({
        page: currentPage,
        pageSize: 20,
        sort: 'latest',
        categoryId: categoryId || undefined,
      });
      return response.data;
    },
  });

  const { data: weeklyHotData } = useQuery({
    queryKey: ['posts', 'weekly-hot'],
    queryFn: async () => {
      const response = await postsApi.getWeeklyHotPosts(8);
      return response.data?.posts || [];
    },
  });

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categories = (categoriesData || []) as Category[];
  const posts = postsData?.posts || [];
  const weeklyHotPosts = weeklyHotData || [];
  const totalPages = postsData?.pagination?.totalPages || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
      {/* 侧边栏 - 分类（桌面端） */}
      <aside className="hidden lg:block lg:col-span-1">
        <div className="bg-white rounded-lg shadow-sm p-4 sticky top-20">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">分类</h2>
          <nav className="space-y-2">
            <button
              onClick={() => handleCategoryClick(null)}
              className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                !categoryId
                  ? 'bg-blue-100 text-blue-800 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              全部
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  categoryId === category.id
                    ? 'bg-blue-100 text-blue-800 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.name}
                {category.isAnonymous && (
                  <span className="ml-1 text-xs text-pink-600">匿名</span>
                )}
                <span className="ml-2 text-xs text-gray-500">({category.postCount})</span>
              </button>
            ))}
          </nav>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">每周热榜</h3>
            {weeklyHotPosts.length === 0 ? (
              <p className="text-xs text-gray-500">本周暂无热门帖子</p>
            ) : (
              <div className="space-y-2">
                {weeklyHotPosts.slice(0, 5).map((post, index) => (
                  <Link
                    key={post.id}
                    to={`/posts/${post.id}`}
                    className="block rounded-md px-2 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-semibold text-blue-600 mt-0.5">#{index + 1}</span>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-900 line-clamp-1">{post.title}</p>
                        <p className="text-[11px] text-gray-500 mt-1">浏览 {post.viewCount}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 主内容区 - 帖子列表 */}
      <div className="lg:col-span-3">
        {/* 移动端分类横向滚动 */}
        <div className="mb-2 lg:hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">分类</span>
          </div>
          <div className="flex space-x-2 overflow-x-auto py-1">
            <button
              onClick={() => handleCategoryClick(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${
                !categoryId
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              全部
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${
                  categoryId === category.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                {category.name}
                {category.isAnonymous && (
                  <span className="ml-1 text-[10px] text-pink-600">匿名</span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-2 bg-white rounded-lg shadow-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-900">每周热榜</h3>
              <Link to="/hot/weekly" className="text-[11px] text-blue-600">全部</Link>
            </div>
            {weeklyHotPosts.length === 0 ? (
              <p className="text-xs text-gray-500">本周暂无热门帖子</p>
            ) : (
              <div className="space-y-2">
                {weeklyHotPosts.slice(0, 3).map((post, index) => (
                  <Link
                    key={post.id}
                    to={`/posts/${post.id}`}
                    className="flex items-center justify-between text-xs text-gray-700 hover:text-blue-600"
                  >
                    <span className="truncate mr-2">{index + 1}. {post.title}</span>
                    <span className="text-gray-500 shrink-0">{post.viewCount}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm hidden md:block">
          {isLoading ? (
            <div className="divide-y divide-gray-200">
              <ListSkeleton count={5} />
            </div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">暂无帖子</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
              {posts.map((post: Post) => (
                <article key={post.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        {post.category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {post.category.name}
                          </span>
                        )}
                        {post.isPinned && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            置顶
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
                      {/* 图片预览 */}
                      {post.images && post.images.length > 0 && (
                        <PostImagePreview images={post.images} postId={post.id} maxImages={3} />
                      )}
                      <div className="flex items-center space-x-6 text-sm text-gray-500 mt-3">
                        <div className="flex items-center space-x-1">
                          <Link
                            to={`/users/${post.userId}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {post.user?.username || '匿名'}
                          </Link>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
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
                    </div>
                  </div>
                </article>
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

        <div className="md:hidden space-y-3">
          {isLoading ? (
            <div className="bg-white rounded-xl p-4">
              <ListSkeleton count={4} />
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center text-sm text-gray-500">暂无帖子</div>
          ) : (
            posts.map((post: Post) => (
              <article key={post.id} className="bg-white rounded-xl px-4 py-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0 overflow-hidden">
                      {post.user?.avatarUrl ? (
                        <img src={getFullUrl(post.user.avatarUrl) || ''} alt={post.user?.username || '用户'} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{post.user?.username || '匿名用户'}</p>
                      <p className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-300">···</span>
                </div>

                <Link to={`/posts/${post.id}`} className="block mt-2">
                  <h3 className="text-[17px] leading-6 text-gray-900 line-clamp-2">{post.title}</h3>
                  <p className="mt-1 text-[15px] leading-6 text-gray-700 line-clamp-3">{post.content}</p>
                </Link>

                {post.images && post.images.length > 0 && (
                  <div className="mt-2">
                    <PostImagePreview images={post.images} postId={post.id} maxImages={4} />
                  </div>
                )}

                <div className="mt-3 flex items-center justify-end gap-5 text-gray-500">
                  <Link to={`/posts/${post.id}`} className="flex items-center gap-1 text-sm">
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.commentCount}</span>
                  </Link>
                  <Link to={`/posts/${post.id}`} className="flex items-center gap-1 text-sm">
                    <Heart className="w-4 h-4" />
                    <span>{post.likeCount}</span>
                  </Link>
                  <Link to={`/posts/${post.id}`} className="flex items-center gap-1 text-sm">
                    <Eye className="w-4 h-4" />
                    <span>{post.viewCount}</span>
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <Link
        to="/posts/new"
        className="md:hidden fixed right-5 bottom-24 z-30 w-12 h-12 rounded-full bg-emerald-500 text-white shadow-lg flex items-center justify-center"
        aria-label="发帖"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}
