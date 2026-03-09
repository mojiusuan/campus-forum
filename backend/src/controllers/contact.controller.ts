import type { Request, Response } from 'express-serve-static-core';
import { sendSuccess, sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';
import prisma from '../utils/db.js';

/**
 * 提交联系我们/用户反馈
 * POST /api/contact
 * 公开接口，无需登录
 */
export async function createContactMessage(req: Request, res: Response) {
  try {
    const { email, subject, content } = req.body as {
      email?: string;
      subject?: string;
      content?: string;
    };

    if (!content || typeof content !== 'string' || content.trim().length < 5) {
      sendError(res, ErrorCode.VALIDATION_ERROR, '请至少填写 5 个字的问题或建议');
      return;
    }

    const normalizedEmail =
      typeof email === 'string' && email.trim().length > 0 ? email.trim() : null;
    const normalizedSubject =
      typeof subject === 'string' && subject.trim().length > 0 ? subject.trim() : null;

    // 尝试获取当前登录用户（如果有）
    const userId = req.user?.userId ?? null;

    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      null;
    const userAgent = (req.headers['user-agent'] as string) || null;

    await prisma.contactMessage.create({
      data: {
        userId,
        email: normalizedEmail,
        subject: normalizedSubject,
        content: content.trim(),
        ipAddress,
        userAgent,
      },
    });

    sendSuccess(res, { message: '已收到您的留言，我们会尽快处理。' });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '提交失败');
  }
}

