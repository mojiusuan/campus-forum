import type { Request, Response, NextFunction } from 'express-serve-static-core';
import { sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';

/**
 * 错误处理中间件
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err);

  // Prisma错误
  if (err.code === 'P2002') {
    sendError(res, ErrorCode.ALREADY_EXISTS, '资源已存在', err.meta);
    return;
  }

  if (err.code === 'P2025') {
    sendError(res, ErrorCode.NOT_FOUND, '资源不存在');
    return;
  }

  // 验证错误
  if (err.name === 'ValidationError') {
    sendError(res, ErrorCode.VALIDATION_ERROR, err.message, err.details);
    return;
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    sendError(res, ErrorCode.TOKEN_INVALID, 'Token无效', undefined, 401);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendError(res, ErrorCode.TOKEN_EXPIRED, 'Token已过期', undefined, 401);
    return;
  }

  // 默认错误
  sendError(
    res,
    ErrorCode.INTERNAL_ERROR,
    err.message || '服务器内部错误',
    process.env.NODE_ENV === 'development' ? err.stack : undefined,
    500
  );
}
