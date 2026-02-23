import type { Request } from 'express-serve-static-core';
import prisma from './db.js';

export type AdminAction =
  | 'delete_post'
  | 'restore_post'
  | 'pin_post'
  | 'unpin_post'
  | 'lock_post'
  | 'unlock_post'
  | 'delete_comment'
  | 'restore_comment'
  | 'ban_user'
  | 'unban_user'
  | 'update_user'
  | 'delete_user'
  | 'reset_password'
  | 'create_category'
  | 'update_category'
  | 'delete_category'
  | 'reorder_categories'
  | 'delete_resource'
  | 'restore_resource';

export type TargetType = 'post' | 'user' | 'comment' | 'category' | 'resource';

interface LogAdminActionParams {
  adminId: string;
  action: AdminAction;
  targetType?: TargetType;
  targetId?: string;
  description?: string;
  req?: Request;
}

/**
 * 记录管理员操作日志
 * 日志记录失败不应影响主流程
 */
export async function logAdminAction(params: LogAdminActionParams): Promise<void> {
  try {
    const { adminId, action, targetType, targetId, description, req } = params;

    // 获取IP地址
    const ipAddress = req?.ip || 
      (req?.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req?.socket?.remoteAddress ||
      null;

    // 获取User-Agent
    const userAgent = req?.headers['user-agent'] || null;

    await prisma.adminLog.create({
      data: {
        adminId,
        action,
        targetType: targetType || null,
        targetId: targetId || null,
        description: description || null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // 日志记录失败不应影响主流程，只记录错误
    console.error('记录操作日志失败:', error);
  }
}
