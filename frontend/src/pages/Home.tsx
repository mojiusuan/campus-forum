/**
 * 首页 - 帖子列表
 */
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { postsApi } from '../api/posts';
import { categoriesApi } from '../api/categories';
import { MessageSquare, Eye, Heart, Clock } from 'lucide-react';
import PostImagePreview from '../components/PostImagePreview';
import Pagination from '../components/Pagination';
import { ListSkeleton } from '../components/LoadingSkeleton';
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

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categories = (categoriesData || []) as Category[];
  const posts = postsData?.posts || [];
  const totalPages = postsData?.pagination?.totalPages || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* 侧边栏 - 分类 */}
      <aside className="lg:col-span-1">
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
                <span className="ml-2 text-xs text-gray-500">({category.postCount})</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* 主内容区 - 帖子列表 */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-lg shadow-sm">
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
      </div>
    </div>
  );
}
