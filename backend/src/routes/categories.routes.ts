import { Router } from 'express';
import { sendSuccess, sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';
import prisma from '../utils/db.js';
import { getParam } from '../utils/params.js';

const router = Router();

/**
 * GET /api/categories
 * 获取分类列表
 */
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        color: true,
        postCount: true,
        isAnonymous: true,
      },
    });

    sendSuccess(res, { categories });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '获取分类列表失败');
  }
});

/**
 * GET /api/categories/:id
 * 获取分类详情
 */
router.get('/:id', async (req, res) => {
  try {
    const id = getParam(req, 'id');
    if (!id) { return sendError(res, ErrorCode.INVALID_INPUT, '无效的ID'); }

    const category = await prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        color: true,
        sortOrder: true,
        postCount: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!category) {
      return sendError(res, ErrorCode.NOT_FOUND, '分类不存在');
    }

    if (!category.isActive) {
      return sendError(res, ErrorCode.NOT_FOUND, '分类已禁用');
    }

    sendSuccess(res, category);
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '获取分类详情失败');
  }
});

export default router;
