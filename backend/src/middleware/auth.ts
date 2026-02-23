import type { Request, Response, NextFunction } from 'express-serve-static-core';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';
import prisma from '../utils/db.js';

// 扩展Request类型，添加user属性（auth 与 adminAuth 共用）
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role?: string;
      };
    }
  }
}

/**
 * 认证中间件
 * 验证JWT Token并检查用户状态
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      sendError(res, ErrorCode.UNAUTHORIZED, '需要登录', undefined, 401);
      return;
    }

    const payload = verifyToken(token);

    // 检查用户是否存在且未被封禁
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, isActive: true },
    });

    if (!user) {
      sendError(res, ErrorCode.NOT_FOUND, '用户不存在', undefined, 404);
      return;
    }

    if (!user.isActive) {
      sendError(res, ErrorCode.FORBIDDEN, '账户已被封禁', undefined, 403);
      return;
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error: any) {
    if (error.message === 'Token已过期') {
      sendError(res, ErrorCode.TOKEN_EXPIRED, 'Token已过期', undefined, 401);
      return;
    }
    if (error.message === 'Token无效') {
      sendError(res, ErrorCode.TOKEN_INVALID, 'Token无效', undefined, 401);
      return;
    }
    sendError(res, ErrorCode.UNAUTHORIZED, '认证失败', undefined, 401);
  }
}

/**
 * 可选认证中间件
 * 如果有Token则验证，没有Token也允许通过
 */
export function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const payload = verifyToken(token);
      req.user = {
        userId: payload.userId,
        email: payload.email,
      };
    }
  } catch (error) {
    // 忽略错误，允许未认证用户访问
  }

  next();
}
