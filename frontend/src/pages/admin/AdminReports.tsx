/**
 * 管理员举报管理页面
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/admin';
import Pagination from '../../components/Pagination';
import { ListSkeleton } from '../../components/LoadingSkeleton';
import { Flag, CheckCircle, FileText, FileDown } from 'lucide-react';
import { getFullUrl } from '../../utils/url';

export default function AdminReports() {
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 20,
    status: 'all' as string,
    targetType: 'all' as string,
  });

  const queryClient = useQueryClient();

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['admin-reports', searchParams],
    queryFn: async () => {
      const response = await adminApi.getReports({
        page: searchParams.page,
        limit: searchParams.limit,
        status: searchParams.status === 'all' ? undefined : searchParams.status,
        targetType: searchParams.targetType === 'all' ? undefined : searchParams.targetType,
      });
      return response.data;
    },
  });

  const processReportMutation = useMutation({
    mutationFn: ({ id, remark }: { id: string; remark?: string }) =>
      adminApi.processReport(id, remark),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    },
  });

  const reports = reportsData?.reports || [];
  const totalPages = reportsData?.pagination?.totalPages || 1;

  const handleProcess = async (id: string) => {
    const remark = window.prompt('处理备注（可选）：');
    if (remark !== null) {
      await processReportMutation.mutateAsync({ id, remark: remark || undefined });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">举报管理</h1>
          <p className="mt-1 text-sm text-gray-500">处理用户对帖子、资料的举报</p>
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
            <select
              value={searchParams.targetType}
              onChange={(e) =>
                setSearchParams((prev) => ({ ...prev, targetType: e.target.value, page: 1 }))
              }
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">全部类型</option>
              <option value="post">帖子</option>
              <option value="resource">资料</option>
            </select>
          </div>

          {isLoading ? (
            <ListSkeleton count={5} />
          ) : reports.length === 0 ? (
            <p className="text-center text-gray-500 py-12">暂无举报</p>
          ) : (
            <>
              <div className="space-y-4">
                {reports.map((report: any) => (
                  <div
                    key={report.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {report.targetType === 'post' ? (
                            <FileText className="w-4 h-4 text-gray-500" />
                          ) : (
                            <FileDown className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="font-medium text-gray-900">
                            {report.targetType === 'post' ? '帖子' : '资料'}举报
                          </span>
                          {report.status === 'pending' ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded">
                              待处理
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                              已处理
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{report.reason}</p>
                        <div className="text-xs text-gray-500">
                          举报人：{report.reporter?.username}（{report.reporter?.email}）
                          {' · '}
                          {new Date(report.createdAt).toLocaleString()}
                        </div>
                        <div className="mt-2 flex gap-2">
                          {report.targetType === 'post' ? (
                            <Link
                              to={`/posts/${report.targetId}`}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              查看帖子
                            </Link>
                          ) : (
                            <Link
                              to="/resources"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              查看资料
                            </Link>
                          )}
                        </div>
                        {report.remark && (
                          <p className="mt-2 text-sm text-gray-500">处理备注：{report.remark}</p>
                        )}
                      </div>
                      {report.status === 'pending' && (
                        <button
                          onClick={() => handleProcess(report.id)}
                          disabled={processReportMutation.isPending}
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