import type { Request, Response } from 'express-serve-static-core';
import { sendSuccess, sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';
import prisma from '../utils/db.js';
import { getParam } from '../utils/params.js';

/**
 * 获取联系我们/用户反馈列表
 * GET /api/admin/contacts
 */
export async function getContacts(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;
    const status = req.query.status as string | undefined; // 'pending' | 'processed'

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [contacts, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      }),
      prisma.contactMessage.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    sendSuccess(res, {
      contacts,
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
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '获取联系我们记录失败');
  }
}

/**
 * 标记联系我们记录为已处理
 * POST /api/admin/contacts/:id/process
 */
export async function processContact(req: Request, res: Response) {
  try {
    const id = getParam(req, 'id');
    if (!id) {
      sendError(res, ErrorCode.INVALID_INPUT, '无效的ID');
      return;
    }

    const contact = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!contact) {
      sendError(res, ErrorCode.NOT_FOUND, '记录不存在');
      return;
    }

    if (contact.status === 'processed') {
      sendError(res, ErrorCode.VALIDATION_ERROR, '该记录已处理');
      return;
    }

    await prisma.contactMessage.update({
      where: { id },
      data: {
        status: 'processed',
      },
    });

    sendSuccess(res, { message: '已标记为已处理' });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '处理失败');
  }
}

