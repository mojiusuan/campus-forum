import type { Request, Response } from 'express-serve-static-core';
import { sendSuccess, sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';
import prisma from '../utils/db.js';

/**
 * 获取操作日志列表
 * GET /api/admin/logs
 */
export async function getLogs(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const adminId = req.query.adminId as string | undefined;
    const action = req.query.action as string | undefined;
    const targetType = req.query.targetType as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    // 构建查询条件
    const where: any = {};

    if (adminId) {
      where.adminId = adminId;
    }

    if (action) {
      where.action = action;
    }

    if (targetType) {
      where.targetType = targetType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
      }
    }

    // 普通管理员不显示由超级管理员执行的操作日志
    if (req.user?.role === 'admin') {
      where.admin = { role: { not: 'super_admin' } };
    }

    // 查询日志
    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      }),
      prisma.adminLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    sendSuccess(res, {
      logs,
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
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '获取操作日志失败');
  }
}
