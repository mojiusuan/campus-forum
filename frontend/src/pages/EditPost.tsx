/**
 * 编辑帖子页面
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { postsApi } from '../api/posts';
import { categoriesApi } from '../api/categories';
import { uploadApi } from '../api/upload';
import { getFullUrl } from '../utils/url';
import { ArrowLeft, AlertCircle, Upload, X } from 'lucide-react';

const editPostSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题最多200字'),
  content: z.string().min(1, '内容不能为空').max(10000, '内容最多10000字'),
  categoryId: z.string().min(1, '请选择分类'),
});

type EditPostFormData = z.infer<typeof editPostSchema>;

export default function EditPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // 获取帖子详情
  const { data: postData, isLoading: postLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      if (!id) throw new Error('Post ID is required');
      const response = await postsApi.getPostById(id);
      return response.data;
    },
    enabled: !!id,
  });

  // 获取分类列表
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesApi.getCategories();
      return response.data?.categories || [];
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditPostFormData>({
    resolver: zodResolver(editPostSchema),
  });

  // 初始化表单数据
  useEffect(() => {
    if (postData) {
      reset({
        title: postData.title,
        content: postData.content,
        categoryId: postData.categoryId,
      });
      // 初始化图片列表
      setImages(postData.images || []);
    }
  }, [postData, reset]);

  // 上传图片
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件');
      return;
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过5MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await uploadApi.uploadImage(formData);
      if (response.success && response.data?.url) {
        setImages([...images, response.data.url]);
      } else {
        setError('图片上传失败');
      }
    } catch (err: any) {
      setError(err.message || '图片上传失败');
    } finally {
      setUploading(false);
      // 重置 input
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // 更新帖子
  const updatePostMutation = useMutation({
    mutationFn: async (data: EditPostFormData) => {
      if (!id) throw new Error('Post ID is required');
      return postsApi.updatePost(id, {
        ...data,
        images: images, // 始终发送图片数组，空数组表示清空所有图片
      });
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
        queryClient.invalidateQueries({ queryKey: ['post', id] });
        navigate(`/posts/${id}`);
      }
    },
    onError: (err: any) => {
      setError(err.message || '更新失败，请稍后重试');
    },
  });

  const onSubmit = async (data: EditPostFormData) => {
    setError(null);
    updatePostMutation.mutate(data);
  };

  if (postLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!postData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">帖子不存在</p>
        <button onClick={() => navigate('/')} className="text-blue-600 hover:text-blue-700 mt-4">
          返回首页
        </button>
      </div>
    );
  }

  const categories = categoriesData || [];

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        返回
      </button>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">编辑帖子</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
              分类 <span className="text-red-500">*</span>
            </label>
            <select
              {...register('categoryId')}
              id="categoryId"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">请选择分类</option>
              {categories.map((category: any) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              type="text"
              id="title"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('content')}
              id="content"
              rows={12}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          {/* 图片编辑 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">图片</label>
            <div className="space-y-4">
              {/* 现有图片预览 */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={getFullUrl(url) || ''}
                        alt={`帖子图片 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 上传按钮 */}
              <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <Upload className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">
                  {uploading ? '上传中...' : '点击上传图片'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500">支持 JPG、PNG、GIF 格式，单张图片不超过5MB</p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={updatePostMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updatePostMutation.isPending ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
