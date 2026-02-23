/**
 * 编辑用户资料页面
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usersApi } from '../api/users';
import { uploadApi } from '../api/upload';
import { useAuthStore } from '../store/authStore';
import { getFullUrl } from '../utils/url';
import { ArrowLeft, AlertCircle, Upload } from 'lucide-react';

const editProfileSchema = z.object({
  // 与后端保持一致：用户名长度 1-20 个字符
  username: z.string().min(1, '用户名至少1位').max(20, '用户名最多20位'),
  bio: z.string().max(200, '简介最多200字').optional(),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

export default function EditProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser, setUser } = useAuthStore();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取用户信息
  const { data: userData } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      if (!id) throw new Error('User ID is required');
      const response = await usersApi.getUserById(id);
      return response.data;
    },
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
  });

  // 初始化表单数据
  useEffect(() => {
    if (userData) {
      reset({
        username: userData.username,
        bio: userData.bio || '',
      });
      setAvatarUrl(userData.avatarUrl || null);
    }
  }, [userData, reset]);

  // 更新用户信息
  const updateUserMutation = useMutation({
    mutationFn: async (data: EditProfileFormData) => {
      if (!id) throw new Error('User ID is required');
      return usersApi.updateUser(id, {
        ...data,
        avatarUrl: avatarUrl || undefined,
      });
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        // 更新当前用户状态
        if (id === currentUser?.id) {
          setUser(response.data);
        }
        queryClient.invalidateQueries({ queryKey: ['user', id] });
        navigate(`/users/${id}`);
      }
    },
    onError: (err: any) => {
      setError(err.message || '更新失败，请稍后重试');
    },
  });

  // 上传头像
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过5MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file); // 后端期望字段名为 'file'

      const response = await uploadApi.uploadImage(formData);
      if (response.success && response.data?.url) {
        setAvatarUrl(response.data.url);
      } else {
        setError('头像上传失败');
      }
    } catch (err: any) {
      setError(err.message || '头像上传失败');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const onSubmit = async (data: EditProfileFormData) => {
    setError(null);
    updateUserMutation.mutate(data);
  };

  if (!userData || id !== currentUser?.id) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">无权访问</p>
        <button onClick={() => navigate('/')} className="text-blue-600 hover:text-blue-700 mt-4">
          返回首页
        </button>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">编辑资料</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* 头像上传 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">头像</label>
            <div className="flex items-center space-x-4">
              {avatarUrl ? (
                <img 
                  src={getFullUrl(avatarUrl) || ''} 
                  alt="头像" 
                  className="w-24 h-24 rounded-full object-cover"
                  onError={(e) => {
                    // 图片加载失败时隐藏
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600">无头像</span>
                </div>
              )}
              <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <Upload className="w-4 h-4 mr-2 text-gray-600" />
                <span className="text-sm text-gray-700">
                  {uploading ? '上传中...' : '上传头像'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* 用户名 */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              用户名 <span className="text-red-500">*</span>
            </label>
            <input
              {...register('username')}
              type="text"
              id="username"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>

          {/* 简介 */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              简介
            </label>
            <textarea
              {...register('bio')}
              id="bio"
              rows={4}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="介绍一下自己..."
            />
            {errors.bio && (
              <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
            )}
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
              disabled={updateUserMutation.isPending || uploading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateUserMutation.isPending ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
