import type { Request, Response } from 'express-serve-static-core';
import { sendSuccess, sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';
import prisma from '../utils/db.js';

/**
 * 搜索帖子
 * GET /api/search/posts
 */
export async function searchPosts(req: Request, res: Response) {
  try {
    const keyword = req.query.keyword as string | undefined;
    const categoryId = req.query.categoryId as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    // 验证关键词
    if (!keyword || keyword.trim().length === 0) {
      return sendError(res, ErrorCode.VALIDATION_ERROR, '搜索关键词不能为空');
    }

    if (keyword.length > 100) {
      return sendError(res, ErrorCode.VALIDATION_ERROR, '搜索关键词不能超过100个字符');
    }

    // 构建查询条件
    const where: any = {
      isDeleted: false,
      OR: [
        { title: { contains: keyword.trim(), mode: 'insensitive' } },
        { content: { contains: keyword.trim(), mode: 'insensitive' } },
      ],
    };

    // 如果指定了分类，添加分类筛选
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // 查询帖子
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.post.count({
        where,
      }),
    ]);

    // 格式化响应数据
    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''), // 截取前200字符
      images: post.images,
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      user: {
        id: post.user.id,
        username: post.user.username,
        avatarUrl: post.user.avatarUrl,
      },
      category: {
        id: post.category.id,
        name: post.category.name,
        slug: post.category.slug,
      },
    }));

    sendSuccess(res, {
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error('搜索帖子失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '搜索帖子失败', error.message);
  }
}

/**
 * 搜索用户
 * GET /api/search/users
 */
export async function searchUsers(req: Request, res: Response) {
  try {
    const keyword = req.query.keyword as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    // 验证关键词
    if (!keyword || keyword.trim().length === 0) {
      return sendError(res, ErrorCode.VALIDATION_ERROR, '搜索关键词不能为空');
    }

    if (keyword.length > 100) {
      return sendError(res, ErrorCode.VALIDATION_ERROR, '搜索关键词不能超过100个字符');
    }

    // 构建查询条件
    const where: any = {
      isActive: true,
      OR: [
        { username: { contains: keyword.trim(), mode: 'insensitive' } },
        { email: { contains: keyword.trim(), mode: 'insensitive' } },
      ],
    };

    // 查询用户
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          bio: true,
          isVerified: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.user.count({
        where,
      }),
    ]);

    sendSuccess(res, {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error('搜索用户失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '搜索用户失败', error.message);
  }
}

/**
 * 统一搜索接口（搜索帖子、用户、资料）
 * GET /api/search
 */
export async function searchAll(req: Request, res: Response) {
  try {
    const keyword = req.query.keyword as string | undefined;
    const type = req.query.type as string | undefined; // 'posts' | 'users' | 'all'
    const categoryId = req.query.categoryId as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    // 验证关键词
    if (!keyword || keyword.trim().length === 0) {
      return sendError(res, ErrorCode.VALIDATION_ERROR, '搜索关键词不能为空');
    }

    if (keyword.length > 100) {
      return sendError(res, ErrorCode.VALIDATION_ERROR, '搜索关键词不能超过100个字符');
    }

    const trimmedKeyword = keyword.trim();
    const results: any = {};

    // 搜索帖子
    if (!type || type === 'posts' || type === 'all') {
      const postWhere: any = {
        isDeleted: false,
        OR: [
          { title: { contains: trimmedKeyword, mode: 'insensitive' } },
          { content: { contains: trimmedKeyword, mode: 'insensitive' } },
        ],
      };

      if (categoryId) {
        postWhere.categoryId = categoryId;
      }

      const [posts, postTotal] = await Promise.all([
        prisma.post.findMany({
          where: postWhere,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: limit,
        }),
        prisma.post.count({
          where: postWhere,
        }),
      ]);

      results.posts = {
        items: posts.map((post) => ({
          id: post.id,
          title: post.title,
          content: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''),
          images: post.images,
          viewCount: post.viewCount,
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          createdAt: post.createdAt,
          user: {
            id: post.user.id,
            username: post.user.username,
            avatarUrl: post.user.avatarUrl,
          },
          category: {
            id: post.category.id,
            name: post.category.name,
            slug: post.category.slug,
          },
        })),
        total: postTotal,
      };
    }

    // 搜索用户
    if (!type || type === 'users' || type === 'all') {
      const userWhere: any = {
        isActive: true,
        OR: [
          { username: { contains: trimmedKeyword, mode: 'insensitive' } },
          { email: { contains: trimmedKeyword, mode: 'insensitive' } },
        ],
      };

      const [users, userTotal] = await Promise.all([
        prisma.user.findMany({
          where: userWhere,
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            bio: true,
            isVerified: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: limit,
        }),
        prisma.user.count({
          where: userWhere,
        }),
      ]);

      results.users = {
        items: users,
        total: userTotal,
      };
    }

    sendSuccess(res, results);
  } catch (error: any) {
    console.error('搜索失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '搜索失败', error.message);
  }
}
