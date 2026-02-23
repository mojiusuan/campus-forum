/**
 * 管理员分类管理页面
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/admin';
import { ListSkeleton } from '../../components/LoadingSkeleton';
import {
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Save,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import type { Category } from '../../types/api';

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
}

export default function AdminCategories() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const queryClient = useQueryClient();

  // 获取分类列表
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const response = await adminApi.getCategories();
      return response.data;
    },
  });

  // 创建分类
  const createCategoryMutation = useMutation({
    mutationFn: (data: Partial<CategoryFormData>) => adminApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setIsCreateModalOpen(false);
    },
  });

  // 更新分类
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryFormData> }) =>
      adminApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setEditingCategory(null);
    },
  });

  // 删除分类
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });

  // 调整分类顺序
  const reorderCategoriesMutation = useMutation({
    mutationFn: (categories: { id: string; sortOrder: number }[]) =>
      adminApi.reorderCategories(categories),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });

  const categories = categoriesData?.categories || [];

  const handleCreate = (formData: CategoryFormData) => {
    createCategoryMutation.mutate(formData);
  };

  const handleUpdate = (id: string, formData: Partial<CategoryFormData>) => {
    updateCategoryMutation.mutate({ id, data: formData });
  };

  const handleDelete = (category: Category) => {
    if (
      window.confirm(
        `确定要删除分类 "${category.name}" 吗？\n${
          category.postCount > 0
            ? `警告：该分类下有 ${category.postCount} 个帖子，删除将失败！`
            : ''
        }`
      )
    ) {
      deleteCategoryMutation.mutate(category.id);
    }
  };

  // 拖拽处理
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newCategories = [...categories];
    const [removed] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(dragOverIndex, 0, removed);

    // 更新sortOrder
    const reorderedCategories = newCategories.map((cat, index) => ({
      id: cat.id,
      sortOrder: index + 1,
    }));

    reorderCategoriesMutation.mutate(reorderedCategories);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">分类管理</h1>
            <p className="mt-1 text-sm text-gray-500">管理内容分类，支持拖拽排序</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>创建分类</span>
          </button>
        </div>

        {/* 分类列表 */}
        <div className="bg-white rounded-lg shadow-sm">
          {isLoading ? (
            <div className="divide-y divide-gray-200">
              <ListSkeleton count={5} />
            </div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>暂无分类，点击上方按钮创建</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {categories.map((category: Category, index: number) => (
                <div
                  key={category.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`p-6 hover:bg-gray-50 transition-colors flex items-center space-x-4 ${
                    draggedIndex === index ? 'opacity-50' : ''
                  } ${dragOverIndex === index ? 'bg-blue-50 border-t-2 border-blue-500' : ''}`}
                >
                  <div className="flex-shrink-0 cursor-move text-gray-400 hover:text-gray-600">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingCategory?.id === category.id ? (
                      <CategoryEditForm
                        category={category}
                        onSave={(data) => handleUpdate(category.id, data)}
                        onCancel={() => setEditingCategory(null)}
                        isLoading={updateCategoryMutation.isPending}
                      />
                    ) : (
                      <>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {category.name}
                          </h3>
                          {category.isActive === false && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              已禁用
                            </span>
                          )}
                          {category.color && (
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                          )}
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span>标识: {category.slug}</span>
                          {category.description && <span>{category.description}</span>}
                          <span>帖子数: {category.postCount}</span>
                          <span>排序: {category.sortOrder || 0}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {editingCategory?.id !== category.id && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingCategory(category)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        disabled={category.postCount > 0}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={category.postCount > 0 ? '该分类下有帖子，无法删除' : '删除'}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 创建分类模态框 */}
        {isCreateModalOpen && (
          <CategoryCreateModal
            onClose={() => setIsCreateModalOpen(false)}
            onSave={handleCreate}
            isLoading={createCategoryMutation.isPending}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// 创建分类表单组件
function CategoryCreateModal({
  onClose,
  onSave,
  isLoading,
}: {
  onClose: () => void;
  onSave: (data: CategoryFormData) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    icon: '',
    color: '#3b82f6',
    isActive: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      alert('分类名称和标识不能为空');
      return;
    }
    onSave(formData);
  };

  // 自动生成slug
  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug || name.toLowerCase().replace(/\s+/g, '-'),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">创建分类</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分类名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="例如：学习"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分类标识 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }))
              }
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="例如：study"
            />
            <p className="mt-1 text-xs text-gray-500">URL友好格式，建议使用英文和连字符</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="分类的简要描述"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">图标</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：book"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">颜色</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="#3b82f6"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              启用分类
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? '创建中...' : '创建'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 编辑分类表单组件（内联）
function CategoryEditForm({
  category,
  onSave,
  onCancel,
  isLoading,
}: {
  category: Category;
  onSave: (data: Partial<CategoryFormData>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<Partial<CategoryFormData>>({
    name: category.name,
    slug: category.slug,
    description: category.description || '',
    icon: category.icon || '',
    color: category.color || '#3b82f6',
    isActive: category.isActive !== false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="分类名称"
          required
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        <input
          type="text"
          value={formData.slug}
          onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
          placeholder="分类标识"
          required
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>
      <textarea
        value={formData.description}
        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
        placeholder="分类描述"
        rows={2}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
      />
      <div className="flex items-center space-x-3">
        <input
          type="text"
          value={formData.icon}
          onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
          placeholder="图标"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
            className="w-10 h-10 border border-gray-300 rounded-md cursor-pointer"
          />
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="text-sm text-gray-700">启用</label>
        </div>
        <div className="flex items-center space-x-1">
          <button
            type="submit"
            disabled={isLoading}
            className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
            title="保存"
          >
            <Check className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title="取消"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </form>
  );
}
