/**
 * 注册页面（需上传学生证，待管理员审核通过后可登录）
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import { uploadApi } from '../api/upload';
import { Mail, Lock, User, AlertCircle, FileImage } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  username: z.string().min(1, '用户名至少1位').max(20, '用户名最多20位'),
  password: z.string().min(6, '密码至少6位'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [studentIdFile, setStudentIdFile] = useState<File | null>(null);
  const [studentIdPreview, setStudentIdPreview] = useState<string | null>(null);
  const [pendingSuccess, setPendingSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      if (!studentIdFile) {
        setError('请上传学生证照片');
        return;
      }
      const formData = new FormData();
      formData.append('file', studentIdFile);
      const uploadRes = await uploadApi.uploadStudentId(formData);
      if (!uploadRes.success || !uploadRes.data?.url) {
        setError('学生证上传失败，请重试');
        return;
      }
      const result = await registerUser(
        data.email,
        data.username,
        data.password,
        data.phone,
        uploadRes.data.url
      );
      if (result?.pending) {
        setPendingSuccess(true);
        return;
      }
      await new Promise((r) => setTimeout(r, 100));
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || '注册失败，请稍后重试');
    }
  };

  if (pendingSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full text-center bg-white rounded-lg shadow p-8">
          <h2 className="text-xl font-bold text-gray-900">注册已提交</h2>
          <p className="mt-4 text-gray-600">
            请等待管理员审核您的学生证。审核通过后即可登录使用。
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            前往登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            注册新账号
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            需上传学生证，审核通过后可登录。已有账号？{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              立即登录
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                邮箱地址
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                用户名
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('username')}
                  type="text"
                  id="username"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="username"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  type="password"
                  id="password"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                确认密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  id="confirmPassword"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                学生证照片 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-shrink-0 cursor-pointer px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 flex items-center gap-2">
                  <FileImage className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {studentIdFile ? studentIdFile.name : '选择图片'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setStudentIdFile(f);
                        setStudentIdPreview(URL.createObjectURL(f));
                      }
                    }}
                  />
                </label>
                {studentIdPreview && (
                  <img
                    src={studentIdPreview}
                    alt="学生证预览"
                    className="w-20 h-20 object-cover rounded border border-gray-200"
                  />
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">支持 JPG、PNG、GIF、WebP，不超过 5MB</p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '注册中...' : '注册'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
