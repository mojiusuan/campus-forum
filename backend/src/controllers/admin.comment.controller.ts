import type { Request, Response } from 'express-serve-static-core';
import { sendSuccess, sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';
import prisma from '../utils/db.js';
import { logAdminAction } from '../utils/adminLog.js';
import { getParam } from '../utils/params.js';

/**
 * 获取评论列表（管理员视图）
 * GET /api/admin/comments
 */
export async function getComments(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const keyword = req.query.keyword as string | undefined;
    const postId = req.query.postId as string | undefined;
    const userId = req.query.userId as string | undefined;
    const status = req.query.status as string | undefined; // 'all' | 'deleted'

    // 构建查询条件
    const where: any = {};

    // 状态筛选
    if (status === 'deleted') {
      where.isDeleted = true;
    } else if (status === 'active') {
      where.isDeleted = false;
    }
    // 'all' 或未指定：显示所有（包括已删除）

    if (postId) {
      where.postId = postId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (keyword) {
      where.content = {
        contains: keyword,
        mode: 'insensitive',
      };
    }

    // 查询评论
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
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
          post: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      prisma.comment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    sendSuccess(res, {
      comments,
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
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '获取评论列表失败');
  }
}

/**
 * 删除评论（硬删除）
 * DELETE /api/admin/comments/:id
 */
export async function deleteComment(req: Request, res: Response) {
  try {
    const id = getParam(req, 'id');
    if (!id) { sendError(res, ErrorCode.INVALID_INPUT, '无效的ID'); return; }
    const adminId = req.user!.userId;

    // 查找评论
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        post: true,
        user: true,
      },
    });

    if (!comment) {
      sendError(res, ErrorCode.NOT_FOUND, '评论不存在');
      return;
    }

    // 硬删除评论（级联删除回复和点赞）
    await prisma.comment.delete({
      where: { id },
    });

    // 更新帖子评论数
    await prisma.post.update({
      where: { id: comment.postId },
      data: {
        commentCount: {
          decrement: 1,
        },
      },
    });

    // 如果有父评论，更新父评论的回复数
    if (comment.parentId) {
      await prisma.comment.update({
        where: { id: comment.parentId },
        data: {
          replyCount: {
            decrement: 1,
          },
        },
      });
    }

    // 记录操作日志
    await logAdminAction({
      adminId,
      action: 'delete_comment',
      targetType: 'comment',
      targetId: id,
      description: `删除评论: ${comment.content.substring(0, 50)}...`,
      req,
    });

    sendSuccess(res, { message: '评论已删除' });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '删除评论失败');
  }
}

/**
 * 恢复评论
 * POST /api/admin/comments/:id/restore
 */
export async function restoreComment(req: Request, res: Response) {
  try {
    const id = getParam(req, 'id');
    if (!id) { sendError(res, ErrorCode.INVALID_INPUT, '无效的ID'); return; }
    const adminId = req.user!.userId;

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      sendError(res, ErrorCode.NOT_FOUND, '评论不存在');
      return;
    }

    if (!comment.isDeleted) {
      sendError(res, ErrorCode.VALIDATION_ERROR, '评论未被删除');
      return;
    }

    await prisma.comment.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });

    // 更新帖子评论数
    await prisma.post.update({
      where: { id: comment.postId },
      data: {
        commentCount: {
          increment: 1,
        },
      },
    });

    // 如果有父评论，更新父评论的回复数
    if (comment.parentId) {
      await prisma.comment.update({
        where: { id: comment.parentId },
        data: {
          replyCount: {
            increment: 1,
          },
        },
      });
    }

    await logAdminAction({
      adminId,
      action: 'restore_comment',
      targetType: 'comment',
      targetId: id,
      description: `恢复评论: ${comment.content.substring(0, 50)}...`,
      req,
    });

    sendSuccess(res, { message: '评论已恢复' });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '恢复评论失败');
  }
}
