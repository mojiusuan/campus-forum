import type { Request, Response } from 'express-serve-static-core';
import { sendSuccess, sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';
import prisma from '../utils/db.js';
import { logAdminAction } from '../utils/adminLog.js';

/**
 * 获取学习资料列表（管理员视图）
 * GET /api/admin/resources
 */
export async function getResources(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const keyword = req.query.keyword as string | undefined;
    const userId = req.query.userId as string | undefined;
    const fileType = req.query.fileType as string | undefined;
    const status = req.query.status as string | undefined; // 'all' | 'active' | 'deleted'

    // 构建查询条件
    const where: any = {};

    // 状态筛选
    if (status === 'deleted') {
      where.isDeleted = true;
    } else if (status === 'active') {
      where.isDeleted = false;
    }
    // 'all' 或未指定：显示所有（包括已删除）

    if (userId) {
      where.userId = userId;
    }

    if (fileType) {
      where.fileType = fileType;
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { fileName: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    // 查询资料
    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.resource.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    sendSuccess(res, {
      resources,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '获取学习资料列表失败');
  }
}

/**
 * 删除学习资料（硬删除）
 * DELETE /api/admin/resources/:id
 */
export async function deleteResource(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const adminId = req.user!.userId;

    // 查找资料
    const resource = await prisma.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      sendError(res, ErrorCode.NOT_FOUND, '学习资料不存在');
      return;
    }

    // 硬删除资料
    await prisma.resource.delete({
      where: { id },
    });

    // 记录操作日志
    await logAdminAction({
      adminId,
      action: 'delete_resource',
      targetType: 'resource',
      targetId: id,
      description: `删除学习资料: ${resource.title}`,
      req,
    });

    sendSuccess(res, { message: '学习资料已删除' });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '删除学习资料失败');
  }
}

/**
 * 恢复学习资料
 * POST /api/admin/resources/:id/restore
 */
export async function restoreResource(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const adminId = req.user!.userId;

    const resource = await prisma.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      sendError(res, ErrorCode.NOT_FOUND, '学习资料不存在');
      return;
    }

    if (!resource.isDeleted) {
      sendError(res, ErrorCode.VALIDATION_ERROR, '学习资料未被删除');
      return;
    }

    await prisma.resource.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });

    await logAdminAction({
      adminId,
      action: 'restore_resource',
      targetType: 'resource',
      targetId: id,
      description: `恢复学习资料: ${resource.title}`,
      req,
    });

    sendSuccess(res, { message: '学习资料已恢复' });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '恢复学习资料失败');
  }
}
