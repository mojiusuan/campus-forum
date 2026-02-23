import type { Response } from 'express-serve-static-core';
import { ErrorCode } from '../types/api.js';

/**
 * 发送成功响应
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void {
  const response = {
    success: true as const,
    data,
    ...(message && { message }),
  };
  res.status(statusCode).json(response);
}

/**
 * 发送错误响应
 */
export function sendError(
  res: Response,
  code: ErrorCode | string,
  message: string,
  details?: any,
  statusCode: number = 400
): void {
  const response = {
    success: false as const,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };

  // 根据错误码设置HTTP状态码
  const httpStatus = getHttpStatus(code, statusCode);
  res.status(httpStatus).json(response);
}

/**
 * 根据错误码获取HTTP状态码
 */
function getHttpStatus(code: ErrorCode | string, defaultStatus: number): number {
  const statusMap: Record<string, number> = {
    [ErrorCode.UNAUTHORIZED]: 401,
    [ErrorCode.FORBIDDEN]: 403,
    [ErrorCode.TOKEN_EXPIRED]: 401,
    [ErrorCode.TOKEN_INVALID]: 401,
    [ErrorCode.VALIDATION_ERROR]: 400,
    [ErrorCode.INVALID_INPUT]: 400,
    [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
    [ErrorCode.NOT_FOUND]: 404,
    [ErrorCode.ALREADY_EXISTS]: 409,
    [ErrorCode.RESOURCE_CONFLICT]: 409,
    [ErrorCode.INTERNAL_ERROR]: 500,
    [ErrorCode.DATABASE_ERROR]: 500,
    [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  };

  return statusMap[code] || defaultStatus;
}
