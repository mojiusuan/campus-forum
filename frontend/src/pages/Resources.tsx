/**
 * 学习资料列表页面
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resourcesApi } from '../api/resources';
import { reportsApi } from '../api/reports';
import { useAuthStore } from '../store/authStore';
import { getFullUrl } from '../utils/url';
import { FileText, Download, User, Calendar, Upload, Flag, X } from 'lucide-react';
import Pagination from '../components/Pagination';
import { ListSkeleton } from '../components/LoadingSkeleton';
import type { Resource } from '../api/resources';

export default function Resources() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');

  const reportMutation = useMutation({
    mutationFn: async ({ targetId, reason }: { targetId: string; reason: string }) =>
      reportsApi.create({ targetType: 'resource', targetId, reason }),
    onSuccess: () => {
      setReportTargetId(null);
      setReportReason('');
      alert('举报已提交，我们会尽快处理');
    },
  });

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTargetId || reportReason.trim().length < 5) {
      alert('请填写至少5个字的举报原因');
      return;
    }
    reportMutation.mutate({ targetId: reportTargetId, reason: reportReason.trim() });
  };

  const { data, isLoading } = useQuery({
    queryKey: ['resources', currentPage],
    queryFn: async () => {
      const response = await resourcesApi.getResources({ page: currentPage, pageSize: 20 });
      return response.data;
    },
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resources = data?.resources || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <FileText className="w-6 h-6" />
            <span>学习资料</span>
            {total > 0 && (
              <span className="text-sm font-normal text-gray-500">({total})</span>
            )}
          </h1>
          <Link
            to="/resources/upload"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>上传资料</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="divide-y divide-gray-200">
            <ListSkeleton count={5} />
          </div>
        ) : resources.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>暂无学习资料</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
            {resources.map((resource: Resource) => (
              <div key={resource.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {resource.title}
                    </h3>
                    {resource.description && (
                      <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                    )}
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        {resource.user?.avatarUrl ? (
                          <img
                            src={getFullUrl(resource.user.avatarUrl) || ''}
                            alt={resource.user.username}
                            className="w-5 h-5 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                        <Link
                          to={`/users/${resource.userId}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {resource.user?.username || '匿名'}
                        </Link>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="w-4 h-4" />
                        <span>{formatFileSize(resource.fileSize)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Download className="w-4 h-4" />
                        <span>{resource.downloadCount} 次下载</span>
                      </div>
                      {!resource.isPublic && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">
                          私有
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    {isAuthenticated && (
                      <button
                        onClick={() => setReportTargetId(resource.id)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                      >
                        <Flag className="w-4 h-4" />
                        <span>举报</span>
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        try {
                          await resourcesApi.downloadResource(resource.id);
                          queryClient.invalidateQueries({ queryKey: ['resources'] });
                        } catch (error: any) {
                          console.error('下载失败:', error);
                          alert(error.message || '下载失败，请稍后重试');
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>下载</span>
                    </button>
                  </div>
                </div>
              </div>
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

        {/* 举报弹窗 */}
        {reportTargetId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">举报资料</h3>
                <button
                  onClick={() => { setReportTargetId(null); setReportReason(''); }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmitReport}>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="请描述举报原因（至少5个字）..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={4}
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setReportTargetId(null); setReportReason(''); }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={reportReason.trim().length < 5 || reportMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {reportMutation.isPending ? '提交中...' : '提交举报'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
