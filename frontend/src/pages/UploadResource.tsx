/**
 * 上传学习资料页面
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { resourcesApi } from '../api/resources';
import { ArrowLeft, Upload, AlertCircle, FileText } from 'lucide-react';

const uploadResourceSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题最多200字'),
  description: z.string().max(1000, '描述最多1000字').optional(),
  isPrivate: z.boolean().default(false), // 前端使用 isPrivate，上传时转换为 isPublic
});

type UploadResourceFormData = z.infer<typeof uploadResourceSchema>;

export default function UploadResource() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UploadResourceFormData>({
    resolver: zodResolver(uploadResourceSchema),
    defaultValues: {
      isPrivate: false,
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadResourceFormData) => {
      if (!file) throw new Error('请选择文件');
      return resourcesApi.uploadResource({
        title: data.title,
        description: data.description,
        file,
        isPrivate: data.isPrivate,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      navigate('/resources');
    },
    onError: (err: any) => {
      setError(err.message || '上传失败，请稍后重试');
    },
  });

  const onSubmit = async (data: UploadResourceFormData) => {
    setError(null);
    if (!file) {
      setError('请选择文件');
      return;
    }
    uploadMutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // 验证文件大小（50MB）
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('文件大小不能超过50MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">上传学习资料</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* 文件选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              文件 <span className="text-red-500">*</span>
            </label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
              {file ? (
                <div className="flex flex-col items-center">
                  <FileText className="w-8 h-8 text-blue-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">点击选择文件</p>
                  <p className="text-xs text-gray-500">最大50MB</p>
                </div>
              )}
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* 标题 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              type="text"
              id="title"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入资料标题"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* 描述 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              描述
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={4}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="请输入资料描述（可选）"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* 隐私设置 */}
          <div className="flex items-center">
            <input
              {...register('isPrivate')}
              type="checkbox"
              id="isPrivate"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-700">
              设为私有（仅自己可见）
            </label>
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
              disabled={uploadMutation.isPending || !file}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadMutation.isPending ? '上传中...' : '上传'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
