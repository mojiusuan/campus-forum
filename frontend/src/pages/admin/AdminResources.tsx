/**
 * 管理员学习资料管理页面
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/admin';
import Pagination from '../../components/Pagination';
import { ListSkeleton } from '../../components/LoadingSkeleton';
import { Search, Trash2, RotateCcw, FileText, User, Download, File } from 'lucide-react';
import { getFullUrl } from '../../utils/url';

interface Resource {
  id: string;
  userId: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  downloadCount: number;
  isPublic: boolean;
  isDeleted: boolean;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}

const FILE_TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF',
  doc: 'Word',
  docx: 'Word',
  ppt: 'PowerPoint',
  pptx: 'PowerPoint',
  xls: 'Excel',
  xlsx: 'Excel',
  zip: '压缩包',
  rar: '压缩包',
  other: '其他',
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export default function AdminResources() {
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 20,
    keyword: '',
    userId: '',
    fileType: 'all',
    status: 'all', // 'all' | 'active' | 'deleted'
  });

  const queryClient = useQueryClient();

  // 获取学习资料列表
  const { data: resourcesData, isLoading } = useQuery({
    queryKey: ['admin-resources', searchParams],
    queryFn: async () => {
      const response = await adminApi.getResources({
        page: searchParams.page,
        limit: searchParams.limit,
        keyword: searchParams.keyword || undefined,
        userId: searchParams.userId || undefined,
        fileType: searchParams.fileType === 'all' ? undefined : searchParams.fileType,
        status: searchParams.status === 'all' ? undefined : searchParams.status,
      });
      return response.data;
    },
  });

  // 删除学习资料
  const deleteResourceMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-resources'] });
    },
  });

  // 恢复学习资料
  const restoreResourceMutation = useMutation({
    mutationFn: (id: string) => adminApi.restoreResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-resources'] });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`确定要删除学习资料 "${title}" 吗？\n此操作不可恢复！`)) {
      await deleteResourceMutation.mutateAsync(id);
    }
  };

  const resources = resourcesData?.resources || [];
  const totalPages = resourcesData?.pagination?.totalPages || 1;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">学习资料管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理所有学习资料</p>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchParams.keyword}
                    onChange={(e) =>
                      setSearchParams((prev) => ({ ...prev, keyword: e.target.value }))
                    }
                    placeholder="搜索标题、描述或文件名..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <select
                  value={searchParams.fileType}
                  onChange={(e) =>
                    setSearchParams((prev) => ({ ...prev, fileType: e.target.value, page: 1 }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">所有类型</option>
                  <option value="pdf">PDF</option>
                  <option value="doc">Word</option>
                  <option value="docx">Word</option>
                  <option value="ppt">PowerPoint</option>
                  <option value="pptx">PowerPoint</option>
                  <option value="xls">Excel</option>
                  <option value="xlsx">Excel</option>
                  <option value="zip">压缩包</option>
                  <option value="rar">压缩包</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                <select
                  value={searchParams.status}
                  onChange={(e) =>
                    setSearchParams((prev) => ({ ...prev, status: e.target.value, page: 1 }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">全部状态</option>
                  <option value="active">正常</option>
                  <option value="deleted">已删除</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                搜索
              </button>
            </div>
          </form>
        </div>

        {/* 学习资料列表 */}
        <div className="bg-white rounded-lg shadow-sm">
          {isLoading ? (
            <div className="divide-y divide-gray-200">
              <ListSkeleton count={5} />
            </div>
          ) : resources.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>没有找到学习资料</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {resources.map((resource: Resource) => (
                  <div key={resource.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          {resource.isDeleted && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                              已删除
                            </span>
                          )}
                          {!resource.isPublic && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              私有
                            </span>
                          )}
                          <File className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {FILE_TYPE_LABELS[resource.fileType] || resource.fileType}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {resource.title}
                        </h3>
                        {resource.description && (
                          <p className="text-gray-600 mb-3 line-clamp-2">{resource.description}</p>
                        )}
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <Link
                              to={`/users/${resource.userId}`}
                              className="hover:text-blue-600"
                            >
                              {resource.user?.username || '匿名'}
                            </Link>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FileText className="w-4 h-4" />
                            <span>{resource.fileName}</span>
                          </div>
                          <span>{formatFileSize(resource.fileSize)}</span>
                          <div className="flex items-center space-x-1">
                            <Download className="w-4 h-4" />
                            <span>{resource.downloadCount} 次下载</span>
                          </div>
                          <span>上传时间: {new Date(resource.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex items-start space-x-2">
                        {resource.isDeleted ? (
                          <button
                            onClick={() => restoreResourceMutation.mutate(resource.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                            title="恢复"
                          >
                            <RotateCcw className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDelete(resource.id, resource.title)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="p-6 border-t border-gray-200">
                  <Pagination
                    currentPage={searchParams.page}
                    totalPages={totalPages}
                    onPageChange={(page) =>
                      setSearchParams((prev) => ({ ...prev, page }))
                    }
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
