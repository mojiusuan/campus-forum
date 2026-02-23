import type { Request, Response, NextFunction } from 'express-serve-static-core';
import { sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';
import prisma from '../utils/db.js';

// Request.user 类型由 auth.ts 扩展

/**
 * 要求管理员权限
 * 验证用户是管理员（admin 或 super_admin）
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.userId) {
      sendError(res, ErrorCode.UNAUTHORIZED, '需要登录', undefined, 401);
      return;
    }

    // 查询用户信息（包含角色）
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!user) {
      sendError(res, ErrorCode.NOT_FOUND, '用户不存在', undefined, 404);
      return;
    }

    if (!user.isActive) {
      sendError(res, ErrorCode.FORBIDDEN, '账户已被禁用', undefined, 403);
      return;
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      sendError(res, ErrorCode.FORBIDDEN, '需要管理员权限', undefined, 403);
      return;
    }

    // 将角色信息添加到req.user
    req.user.role = user.role;

    next();
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '权限验证失败');
  }
}

/**
 * 要求超级管理员权限
 * 验证用户是超级管理员（super_admin）
 */
export async function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.userId) {
      sendError(res, ErrorCode.UNAUTHORIZED, '需要登录', undefined, 401);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      sendError(res, ErrorCode.FORBIDDEN, '账户已被禁用', undefined, 403);
      return;
    }

    if (user.role !== 'super_admin') {
      sendError(res, ErrorCode.FORBIDDEN, '需要超级管理员权限', undefined, 403);
      return;
    }

    req.user.role = user.role;
    next();
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '权限验证失败');
  }
}
