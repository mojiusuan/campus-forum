/**
 * 搜索页面
 */
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { postsApi } from '../api/posts';
import { categoriesApi } from '../api/categories';
import { Search as SearchIcon, MessageSquare, Eye, Heart, Clock } from 'lucide-react';
import PostImagePreview from '../components/PostImagePreview';
import Pagination from '../components/Pagination';
import { ListSkeleton } from '../components/LoadingSkeleton';
import { useDebounce } from '../hooks/useDebounce';
import type { Post, Category } from '../types/api';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1')
  );
  
  // 防抖搜索关键词
  const debouncedKeyword = useDebounce(keyword, 500);

  // 获取分类列表
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesApi.getCategories();
      return response.data?.categories || [];
    },
  });

  // 当搜索关键词或分类改变时，重置到第一页并更新URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedKeyword.trim()) {
      params.set('keyword', debouncedKeyword.trim());
    }
    if (selectedCategory) {
      params.set('category', selectedCategory);
    }
    // 只有当参数变化时才更新URL
    const currentKeyword = searchParams.get('keyword') || '';
    const currentCategory = searchParams.get('category') || '';
    if (debouncedKeyword.trim() !== currentKeyword || selectedCategory !== currentCategory) {
      setCurrentPage(1);
      setSearchParams(params, { replace: true });
    }
  }, [debouncedKeyword, selectedCategory, searchParams, setSearchParams]);

  // 搜索帖子（使用防抖后的关键词）
  // 如果有关键词，使用搜索API；如果只有分类，使用帖子列表API
  const { data: postsData, isLoading } = useQuery({
    queryKey: ['search-posts', debouncedKeyword, selectedCategory, currentPage],
    queryFn: async () => {
      const hasKeyword = debouncedKeyword.trim();
      
      if (hasKeyword) {
        // 有关键词：使用搜索API
        const response = await postsApi.searchPosts(debouncedKeyword, {
          categoryId: selectedCategory || undefined,
          page: currentPage,
          pageSize: 20,
        });
        const data = response.data;
        return {
          posts: data?.posts || [],
          total: data?.pagination?.total || 0,
          totalPages: data?.pagination?.totalPages || 0,
        };
      } else if (selectedCategory) {
        // 没有关键词但有分类：使用帖子列表API按分类筛选
        const response = await postsApi.getPosts({
          categoryId: selectedCategory,
          page: currentPage,
          pageSize: 20,
          sort: 'latest',
        });
        const data = response.data;
        return {
          posts: data?.posts || [],
          total: data?.pagination?.total || 0,
          totalPages: data?.pagination?.totalPages || 0,
        };
      } else {
        // 既没有关键词也没有分类：返回空结果
        return { posts: [], total: 0, totalPages: 0 };
      }
    },
    enabled: !!debouncedKeyword.trim() || !!selectedCategory,
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams);
    if (keyword.trim()) {
      params.set('keyword', keyword.trim());
    }
    if (selectedCategory) {
      params.set('category', selectedCategory);
    }
    params.set('page', page.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (debouncedKeyword.trim()) {
      params.set('keyword', debouncedKeyword.trim());
    }
    if (selectedCategory) {
      params.set('category', selectedCategory);
    }
    params.set('page', '1'); // 搜索时重置到第一页
    setSearchParams(params);
    setCurrentPage(1);
  };

  const categories = (categoriesData || []) as Category[];
  const posts = postsData?.posts || [];
  const total = postsData?.total || 0;
  const totalPages = postsData?.totalPages || 1;

  return (
    <div className="max-w-4xl mx-auto">
      {/* 搜索框 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索帖子..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              搜索
            </button>
          </div>

          {/* 分类筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">分类筛选</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  !selectedCategory
                    ? 'bg-blue-600 text-white font-medium'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                全部
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white font-medium'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* 搜索结果 */}
      <div className="bg-white rounded-lg shadow-sm">
        {(keyword.trim() || selectedCategory) ? (
          <>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {keyword.trim() ? '搜索结果' : '分类帖子'}
                {total > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    （共 {total} 条）
                  </span>
                )}
              </h2>
            </div>

            {isLoading ? (
              <div className="divide-y divide-gray-200">
                <ListSkeleton count={5} />
              </div>
            ) : posts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>没有找到相关帖子</p>
                <p className="text-sm mt-2">试试其他关键词或分类</p>
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{post.content}</p>
                        {/* 图片预览 */}
                        {post.images && post.images.length > 0 && (
                          <PostImagePreview images={post.images} postId={post.id} maxImages={3} />
                        )}
                        <div className="flex items-center space-x-6 text-sm text-gray-500 mt-3">
                          <div className="flex items-center space-x-1">
                            <span>{post.user?.username || '匿名'}</span>
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
          </>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <SearchIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>请输入关键词搜索</p>
          </div>
        )}
      </div>
    </div>
  );
}
