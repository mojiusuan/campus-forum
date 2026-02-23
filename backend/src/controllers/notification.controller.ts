import type { Request, Response } from 'express-serve-static-core';
import { sendSuccess, sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';
import prisma from '../utils/db.js';

/**
 * 获取通知列表
 * GET /api/notifications
 */
export async function getNotifications(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const isRead = req.query.isRead as string | undefined;
    const skip = (page - 1) * limit;

    if (!userId) {
      return sendError(res, ErrorCode.UNAUTHORIZED, '请先登录');
    }

    // 构建查询条件
    const where: any = {
      userId,
    };

    // 如果指定了isRead，添加筛选条件
    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    // 获取通知列表
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.notification.count({
        where,
      }),
    ]);

    // 格式化响应数据
    const formattedNotifications = notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      link: notification.link,
      relatedId: notification.relatedId,
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    }));

    sendSuccess(res, {
      notifications: formattedNotifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error('获取通知列表失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '获取通知列表失败', error.message);
  }
}

/**
 * 标记通知已读
 * PUT /api/notifications/:id/read
 */
export async function markNotificationAsRead(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return sendError(res, ErrorCode.UNAUTHORIZED, '请先登录');
    }

    // 查找通知
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return sendError(res, ErrorCode.NOT_FOUND, '通知不存在');
    }

    // 验证权限（只能标记自己的通知）
    if (notification.userId !== userId) {
      return sendError(res, ErrorCode.FORBIDDEN, '无权标记此通知');
    }

    // 如果已经已读，直接返回
    if (notification.isRead) {
      return sendSuccess(res, {
        id: notification.id,
        isRead: true,
        readAt: notification.readAt,
      }, '通知已标记为已读');
    }

    // 标记为已读
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    sendSuccess(res, {
      id: updatedNotification.id,
      isRead: updatedNotification.isRead,
      readAt: updatedNotification.readAt,
    }, '通知已标记为已读');
  } catch (error: any) {
    console.error('标记通知已读失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '标记通知已读失败', error.message);
  }
}

/**
 * 标记所有通知已读
 * PUT /api/notifications/read-all
 */
export async function markAllNotificationsAsRead(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return sendError(res, ErrorCode.UNAUTHORIZED, '请先登录');
    }

    // 更新所有未读通知
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    sendSuccess(res, {
      updatedCount: result.count,
    }, `已标记 ${result.count} 条通知为已读`);
  } catch (error: any) {
    console.error('标记所有通知已读失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '标记所有通知已读失败', error.message);
  }
}

/**
 * 获取未读通知数
 * GET /api/notifications/unread-count
 */
export async function getUnreadNotificationCount(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return sendError(res, ErrorCode.UNAUTHORIZED, '请先登录');
    }

    // 统计未读通知数
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    sendSuccess(res, {
      unreadCount,
    });
  } catch (error: any) {
    console.error('获取未读通知数失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '获取未读通知数失败', error.message);
  }
}
