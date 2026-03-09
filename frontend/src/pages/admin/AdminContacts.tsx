/**
 * 管理员联系我们/用户反馈管理页面
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/admin';
import Pagination from '../../components/Pagination';
import { ListSkeleton } from '../../components/LoadingSkeleton';
import { Mail, CheckCircle, User as UserIcon } from 'lucide-react';

export default function AdminContacts() {
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 20,
    status: 'all' as string,
  });

  const queryClient = useQueryClient();

  const { data: contactsData, isLoading } = useQuery({
    queryKey: ['admin-contacts', searchParams],
    queryFn: async () => {
      const response = await adminApi.getContacts({
        page: searchParams.page,
        limit: searchParams.limit,
        status: searchParams.status === 'all' ? undefined : searchParams.status,
      });
      return response.data;
    },
  });

  const processContactMutation = useMutation({
    mutationFn: (id: string) => adminApi.processContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
    },
  });

  const contacts = contactsData?.contacts || [];
  const totalPages = contactsData?.pagination?.totalPages || 1;

  const handleProcess = async (id: string) => {
    if (window.confirm('确认将此条联系我们记录标记为已处理？')) {
      await processContactMutation.mutateAsync(id);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">联系我们 / 用户反馈</h1>
          <p className="mt-1 text-sm text-gray-500">
            查看并处理用户通过“联系我们”提交的问题和建议。
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <select
              value={searchParams.status}
              onChange={(e) =>
                setSearchParams((prev) => ({ ...prev, status: e.target.value, page: 1 }))
              }
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">全部状态</option>
              <option value="pending">待处理</option>
              <option value="processed">已处理</option>
            </select>
          </div>

          {isLoading ? (
            <ListSkeleton count={5} />
          ) : contacts.length === 0 ? (
            <p className="text-center text-gray-500 py-12">暂无用户反馈</p>
          ) : (
            <>
              <div className="space-y-4">
                {contacts.map((item: any) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {item.subject || '未填写主题'}
                          </span>
                          {item.status === 'pending' ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded">
                              待处理
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                              已处理
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                          {item.content}
                        </p>
                        <div className="mt-2 text-xs text-gray-500 space-y-1">
                          <div className="flex items-center gap-2">
                            {item.user ? (
                              <>
                                <UserIcon className="w-3 h-3" />
                                <span>
                                  用户：{item.user.username}（{item.user.email}）
                                </span>
                              </>
                            ) : item.email ? (
                              <>
                                <Mail className="w-3 h-3" />
                                <span>邮箱：{item.email}</span>
                              </>
                            ) : (
                              <span>匿名用户</span>
                            )}
                          </div>
                          <div>
                            提交时间：{new Date(item.createdAt).toLocaleString()}
                            {item.ipAddress && ` · IP：${item.ipAddress}`}
                          </div>
                        </div>
                      </div>
                      {item.status === 'pending' && (
                        <button
                          onClick={() => handleProcess(item.id)}
                          disabled={processContactMutation.isPending}
                          className="flex-shrink-0 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          标记已处理
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Pagination
                    currentPage={searchParams.page}
                    totalPages={totalPages}
                    onPageChange={(page) => setSearchParams((prev) => ({ ...prev, page }))}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

