import type { Request } from 'express-serve-static-core';
import type { Response } from 'express-serve-static-core';
import { sendError } from './response.js';
import { ErrorCode } from '../types/api.js';

/**
 * 从 req.params 获取字符串参数（Express 的 params 可能是 string | string[]）
 */
export function getParam(
  req: Request,
  key: string
): string | undefined {
  const v = req.params[key];
  return typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined;
}

/**
 * 获取必需的 id 参数，若缺失则发送错误并返回 undefined
 */
export function requireId(req: Request, res: Response): string | undefined {
  const id = getParam(req, 'id');
  if (!id) {
    sendError(res, ErrorCode.INVALID_INPUT, '无效的ID');
    return undefined;
  }
  return id;
}

/**
 * 获取必需的路由参数，若缺失则发送错误并返回 undefined
 */
export function requireParam(
  req: Request,
  res: Response,
  key: string,
  label = '参数'
): string | undefined {
  const val = getParam(req, key);
  if (!val) {
    sendError(res, ErrorCode.INVALID_INPUT, `无效的${label}`);
    return undefined;
  }
  return val;
}
