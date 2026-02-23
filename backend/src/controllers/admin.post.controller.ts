import type { Request, Response } from 'express-serve-static-core';
import { sendSuccess, sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';
import prisma from '../utils/db.js';
import { logAdminAction } from '../utils/adminLog.js';
import { getParam } from '../utils/params.js';

/**
 * 获取帖子列表（管理员视图）
 * GET /api/admin/posts
 */
export async function getPosts(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const keyword = req.query.keyword as string | undefined;
    const categoryId = req.query.categoryId as string | undefined;
    const userId = req.query.userId as string | undefined;
    const status = req.query.status as string | undefined; // 'all' | 'deleted' | 'pinned' | 'locked'

    // 构建查询条件
    const where: any = {};

    // 状态筛选
    if (status === 'deleted') {
      where.isDeleted = true;
    } else if (status === 'pinned') {
      where.isPinned = true;
      where.isDeleted = false;
    } else if (status === 'locked') {
      where.isLocked = true;
      where.isDeleted = false;
    } else if (status === 'active') {
      where.isDeleted = false;
      where.isLocked = false;
    }
    // 'all' 或未指定：显示所有（包括已删除）

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { content: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    // 查询帖子
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
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
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    sendSuccess(res, {
      posts,
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
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '获取帖子列表失败');
  }
}

/**
 * 删除帖子（硬删除）
 * DELETE /api/admin/posts/:id
 */
export async function deletePost(req: Request, res: Response) {
  try {
    const id = getParam(req, 'id');
    if (!id) { sendError(res, ErrorCode.INVALID_INPUT, '无效的ID'); return; }
    const adminId = req.user!.userId;

    // 查找帖子
    const post = await prisma.post.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!post) {
      sendError(res, ErrorCode.NOT_FOUND, '帖子不存在');
      return;
    }

    // 硬删除帖子（级联删除评论、点赞、收藏）
    await prisma.post.delete({
      where: { id },
    });

    // 更新分类统计
    await prisma.category.update({
      where: { id: post.categoryId },
      data: {
        postCount: {
          decrement: 1,
        },
      },
    });

    // 记录操作日志
    await logAdminAction({
      adminId,
      action: 'delete_post',
      targetType: 'post',
      targetId: id,
      description: `删除帖子: ${post.title}`,
      req,
    });

    sendSuccess(res, { message: '帖子已删除' });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '删除帖子失败');
  }
}

/**
 * 恢复帖子
 * POST /api/admin/posts/:id/restore
 */
export async function restorePost(req: Request, res: Response) {
  try {
    const id = getParam(req, 'id');
    if (!id) { sendError(res, ErrorCode.INVALID_INPUT, '无效的ID'); return; }
    const adminId = req.user!.userId;

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      sendError(res, ErrorCode.NOT_FOUND, '帖子不存在');
      return;
    }

    if (!post.isDeleted) {
      sendError(res, ErrorCode.VALIDATION_ERROR, '帖子未被删除');
      return;
    }

    await prisma.post.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });

    await logAdminAction({
      adminId,
      action: 'restore_post',
      targetType: 'post',
      targetId: id,
      description: `恢复帖子: ${post.title}`,
      req,
    });

    sendSuccess(res, { message: '帖子已恢复' });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '恢复帖子失败');
  }
}

/**
 * 置顶帖子
 * POST /api/admin/posts/:id/pin
 */
export async function pinPost(req: Request, res: Response) {
  try {
    const id = getParam(req, 'id');
    if (!id) { sendError(res, ErrorCode.INVALID_INPUT, '无效的ID'); return; }
    const adminId = req.user!.userId;

    const post = await prisma.post.update({
      where: { id },
      data: { isPinned: true },
    });

    await logAdminAction({
      adminId,
      action: 'pin_post',
      targetType: 'post',
      targetId: id,
      description: `置顶帖子: ${post.title}`,
      req,
    });

    sendSuccess(res, { message: '帖子已置顶' });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '置顶帖子失败');
  }
}

/**
 * 取消置顶
 * DELETE /api/admin/posts/:id/pin
 */
export async function unpinPost(req: Request, res: Response) {
  try {
    const id = getParam(req, 'id');
    if (!id) { sendError(res, ErrorCode.INVALID_INPUT, '无效的ID'); return; }
    const adminId = req.user!.userId;

    const post = await prisma.post.update({
      where: { id },
      data: { isPinned: false },
    });

    await logAdminAction({
      adminId,
      action: 'unpin_post',
      targetType: 'post',
      targetId: id,
      description: `取消置顶帖子: ${post.title}`,
      req,
    });

    sendSuccess(res, { message: '已取消置顶' });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '取消置顶失败');
  }
}

/**
 * 锁定帖子
 * POST /api/admin/posts/:id/lock
 */
export async function lockPost(req: Request, res: Response) {
  try {
    const id = getParam(req, 'id');
    if (!id) { sendError(res, ErrorCode.INVALID_INPUT, '无效的ID'); return; }
    const adminId = req.user!.userId;

    const post = await prisma.post.update({
      where: { id },
      data: { isLocked: true },
    });

    await logAdminAction({
      adminId,
      action: 'lock_post',
      targetType: 'post',
      targetId: id,
      description: `锁定帖子: ${post.title}`,
      req,
    });

    sendSuccess(res, { message: '帖子已锁定' });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '锁定帖子失败');
  }
}

/**
 * 解锁帖子
 * DELETE /api/admin/posts/:id/lock
 */
export async function unlockPost(req: Request, res: Response) {
  try {
    const id = getParam(req, 'id');
    if (!id) { sendError(res, ErrorCode.INVALID_INPUT, '无效的ID'); return; }
    const adminId = req.user!.userId;

    const post = await prisma.post.update({
      where: { id },
      data: { isLocked: false },
    });

    await logAdminAction({
      adminId,
      action: 'unlock_post',
      targetType: 'post',
      targetId: id,
      description: `解锁帖子: ${post.title}`,
      req,
    });

    sendSuccess(res, { message: '帖子已解锁' });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '解锁帖子失败');
  }
}
