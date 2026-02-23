import type { Request, Response } from 'express-serve-static-core';
import { sendSuccess, sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';
import prisma from '../utils/db.js';
import { logAdminAction } from '../utils/adminLog.js';
import { getParam } from '../utils/params.js';

/**
 * 获取分类列表（管理员视图，包含所有分类）
 * GET /api/admin/categories
 */
export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
    });

    // 使用 Category 的 postCount 字段
    const formattedCategories = categories.map((category) => ({
      ...category,
      postCount: category.postCount,
    }));

    sendSuccess(res, { categories: formattedCategories });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '获取分类列表失败');
  }
}

/**
 * 创建分类
 * POST /api/admin/categories
 */
export async function createCategory(req: Request, res: Response) {
  try {
    const { name, slug, description, icon, color, sortOrder } = req.body;
    const adminId = req.user!.userId;

    // 验证必填字段
    if (!name || !slug) {
      sendError(res, ErrorCode.VALIDATION_ERROR, '分类名称和标识不能为空');
      return;
    }

    // 检查slug是否已存在
    const existingCategory = await prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      sendError(res, ErrorCode.VALIDATION_ERROR, '分类标识已存在');
      return;
    }

    // 获取当前最大的sortOrder
    const maxSortOrder = await prisma.category.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const newSortOrder = sortOrder !== undefined ? sortOrder : (maxSortOrder?.sortOrder || 0) + 1;

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        icon,
        color: color || '#3b82f6',
        sortOrder: newSortOrder,
        isActive: true,
      },
    });

    await logAdminAction({
      adminId,
      action: 'create_category',
      targetType: 'category',
      targetId: category.id,
      description: `创建分类: ${name}`,
      req,
    });

    sendSuccess(res, { category }, 201);
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '创建分类失败');
  }
}

/**
 * 更新分类
 * PUT /api/admin/categories/:id
 */
export async function updateCategory(req: Request, res: Response) {
  try {
    const id = getParam(req, 'id');
    if (!id) {
      sendError(res, ErrorCode.INVALID_INPUT, '无效的ID');
      return;
    }
    const { name, slug, description, icon, color, sortOrder, isActive } = req.body;
    const adminId = req.user!.userId;

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      sendError(res, ErrorCode.NOT_FOUND, '分类不存在');
      return;
    }

    // 如果更新slug，检查是否与其他分类冲突
    if (slug && slug !== category.slug) {
      const existingCategory = await prisma.category.findUnique({
        where: { slug },
      });

      if (existingCategory) {
        sendError(res, ErrorCode.VALIDATION_ERROR, '分类标识已存在');
        return;
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    await logAdminAction({
      adminId,
      action: 'update_category',
      targetType: 'category',
      targetId: id,
      description: `更新分类: ${updatedCategory.name}`,
      req,
    });

    sendSuccess(res, { category: updatedCategory });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '更新分类失败');
  }
}

/**
 * 删除分类
 * DELETE /api/admin/categories/:id
 */
export async function deleteCategory(req: Request, res: Response) {
  try {
    const id = getParam(req, 'id');
    if (!id) {
      sendError(res, ErrorCode.INVALID_INPUT, '无效的ID');
      return;
    }
    const adminId = req.user!.userId;

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      sendError(res, ErrorCode.NOT_FOUND, '分类不存在');
      return;
    }

    // 检查是否有帖子使用此分类（使用 Category 的 postCount 字段）
    if (category.postCount > 0) {
      sendError(res, ErrorCode.VALIDATION_ERROR, `该分类下有 ${category.postCount} 个帖子，无法删除`);
      return;
    }

    await prisma.category.delete({
      where: { id },
    });

    await logAdminAction({
      adminId,
      action: 'delete_category',
      targetType: 'category',
      targetId: id,
      description: `删除分类: ${category.name}`,
      req,
    });

    sendSuccess(res, { message: '分类已删除' });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '删除分类失败');
  }
}

/**
 * 调整分类顺序
 * POST /api/admin/categories/reorder
 */
export async function reorderCategories(req: Request, res: Response) {
  try {
    const { categories } = req.body; // [{ id: string, sortOrder: number }]
    const adminId = req.user!.userId;

    if (!Array.isArray(categories) || categories.length === 0) {
      sendError(res, ErrorCode.VALIDATION_ERROR, '分类列表不能为空');
      return;
    }

    // 批量更新分类顺序
    const updatePromises = categories.map((item: { id: string; sortOrder: number }) =>
      prisma.category.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    );

    await Promise.all(updatePromises);

    await logAdminAction({
      adminId,
      action: 'reorder_categories',
      targetType: 'category',
      targetId: null,
      description: `调整分类顺序`,
      req,
    });

    sendSuccess(res, { message: '分类顺序已更新' });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '调整分类顺序失败');
  }
}
