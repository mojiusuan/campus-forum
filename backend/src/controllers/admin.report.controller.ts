import type { Request, Response } from 'express-serve-static-core';
import { sendSuccess, sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';
import prisma from '../utils/db.js';
import { getParam } from '../utils/params.js';

/**
 * 获取举报列表
 * GET /api/admin/reports
 */
export async function getReports(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;
    const status = req.query.status as string | undefined; // 'pending' | 'processed'
    const targetType = req.query.targetType as string | undefined; // 'post' | 'resource'

    const where: any = {};
    if (status) where.status = status;
    if (targetType) where.targetType = targetType;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    sendSuccess(res, {
      reports,
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
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '获取举报列表失败');
  }
}

/**
 * 处理举报（标记为已处理）
 * POST /api/admin/reports/:id/process
 */
export async function processReport(req: Request, res: Response) {
  try {
    const id = getParam(req, 'id');
    if (!id) {
      sendError(res, ErrorCode.INVALID_INPUT, '无效的ID');
      return;
    }
    const adminId = req.user!.userId;
    const { remark } = req.body;

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      sendError(res, ErrorCode.NOT_FOUND, '举报记录不存在');
      return;
    }

    if (report.status === 'processed') {
      sendError(res, ErrorCode.VALIDATION_ERROR, '该举报已处理');
      return;
    }

    await prisma.report.update({
      where: { id },
      data: {
        status: 'processed',
        processedBy: adminId,
        processedAt: new Date(),
        remark: remark ? String(remark).trim() : null,
      },
    });

    sendSuccess(res, { message: '已标记为已处理' });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '处理失败');
  }
}
