/**
 * 联系我们页面（公开，无需登录）
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactApi } from '../api/contact';
import { Mail, MessageCircle, AlertCircle } from 'lucide-react';

const contactSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址').optional().or(z.literal('')),
  subject: z.string().max(50, '主题最多 50 个字').optional(),
  content: z.string().min(5, '请至少填写 5 个字的问题或建议'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Contact() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      setError(null);
      setSuccess(null);
      await contactApi.create({
        email: data.email || undefined,
        subject: data.subject,
        content: data.content,
      });
      setSuccess('已收到您的留言，我们会尽快处理。');
      reset();
    } catch (e: any) {
      setError(e?.message || '提交失败，请稍后重试。');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
            <MessageCircle className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">联系我们</h2>
          <p className="mt-2 text-sm text-gray-600">
            如果你在使用中遇到问题、发现违规内容，或有任何功能建议，欢迎通过此表单告诉我们。
          </p>
          <p className="mt-1 text-xs text-gray-500">
            也可以直接发送邮件至：<span className="font-mono">xduzone@126.com</span>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 bg-white rounded-lg shadow-sm p-6 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              联系邮箱（可选）
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                {...register('email')}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="如果希望收到回复，请填写邮箱地址"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              主题（可选）
            </label>
            <input
              type="text"
              {...register('subject')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="如：登录问题 / 功能建议 / 违规内容反馈 等"
            />
            {errors.subject && (
              <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              问题与建议（必填）
            </label>
            <textarea
              rows={5}
              {...register('content')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="请描述你遇到的问题、想反馈的内容或功能建议，至少 5 个字。"
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? '提交中...' : '提交'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

