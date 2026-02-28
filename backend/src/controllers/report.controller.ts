import type { Request, Response } from 'express-serve-static-core';
import { sendSuccess, sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';
import prisma from '../utils/db.js';

/**
 * 提交举报（帖子或资料）
 * POST /api/reports
 */
export async function createReport(req: Request, res: Response) {
  try {
    const { targetType, targetId, reason } = req.body;
    const reporterId = req.user!.userId;

    if (!targetType || !targetId || !reason) {
      sendError(res, ErrorCode.MISSING_REQUIRED_FIELD, '请填写举报类型、目标ID和举报原因');
      return;
    }

    if (!['post', 'resource'].includes(targetType)) {
      sendError(res, ErrorCode.VALIDATION_ERROR, '举报类型仅支持 post 或 resource');
      return;
    }

    const reasonStr = String(reason).trim();
    if (reasonStr.length < 5) {
      sendError(res, ErrorCode.VALIDATION_ERROR, '举报原因至少5个字符');
      return;
    }

    // 校验目标存在
    if (targetType === 'post') {
      const post = await prisma.post.findFirst({
        where: { id: targetId, isDeleted: false },
      });
      if (!post) {
        sendError(res, ErrorCode.NOT_FOUND, '帖子不存在');
        return;
      }
    } else {
      const resource = await prisma.resource.findFirst({
        where: { id: targetId, isDeleted: false },
      });
      if (!resource) {
        sendError(res, ErrorCode.NOT_FOUND, '资料不存在');
        return;
      }
    }

    // 可选：同一用户对同一目标仅保留一条未处理举报
    const existing = await prisma.report.findFirst({
      where: {
        targetType,
        targetId,
        reporterId,
        status: 'pending',
      },
    });
    if (existing) {
      sendError(res, ErrorCode.VALIDATION_ERROR, '您已举报过该内容，请等待处理');
      return;
    }

    await prisma.report.create({
      data: {
        targetType,
        targetId,
        reporterId,
        reason: reasonStr,
      },
    });

    sendSuccess(res, { message: '举报已提交，我们会尽快处理' });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '提交举报失败');
  }
}
