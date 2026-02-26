import type { Request, Response } from 'express-serve-static-core';
import { sendSuccess, sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';
import prisma from '../utils/db.js';
import { getParam } from '../utils/params.js';
import { getAnonymousUserId, maskUserForAnonymous } from '../utils/anonymous.js';

/**
 * 获取帖子列表
 */
export async function getPosts(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const categoryId = req.query.categoryId as string | undefined;
    const sort = (req.query.sort as string) || 'latest';
    const keyword = req.query.keyword as string | undefined;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {
      isDeleted: false,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    // 支持按用户ID筛选
    const userId = req.query.userId as string | undefined;
    if (userId) {
      where.userId = userId;
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { content: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    // 构建排序
    let orderBy: any = {};
    switch (sort) {
      case 'hot':
        orderBy = { likeCount: 'desc' };
        break;
      case 'popular':
        orderBy = { viewCount: 'desc' };
        break;
      case 'latest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // 查询帖子
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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
              isAnonymous: true,
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const postsMasked = posts.map((p: any) => ({
      ...p,
      user: maskUserForAnonymous(p.user, p.category?.isAnonymous === true),
    }));

    sendSuccess(res, {
      posts: postsMasked,
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
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '获取帖子列表失败');
  }
}

/**
 * 获取帖子详情
 */
export async function getPostById(req: Request, res: Response) {
  try {
    const id = getParam(req, 'id');
    if (!id) { sendError(res, ErrorCode.INVALID_INPUT, '无效的ID'); return; }
    const userId = (req as any).user?.userId;

    // 查找帖子
    const post = await prisma.post.findUnique({
      where: { id },
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
            isAnonymous: true,
          },
        },
      },
    });

    if (!post || post.isDeleted) {
      sendError(res, ErrorCode.NOT_FOUND, '帖子不存在');
      return;
    }

    const categoryIsAnonymous = (post.category as any)?.isAnonymous === true;
    const postForResponse = {
      ...post,
      user: maskUserForAnonymous((post as any).user, categoryIsAnonymous),
    };

    // 增加浏览量
    await prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // 检查是否点赞和收藏（如果用户已登录）
    let isLiked = false;
    let isFavorited = false;

    if (userId) {
      const [like, favorite] = await Promise.all([
        prisma.like.findUnique({
          where: {
            userId_targetType_targetId: {
              userId,
              targetType: 'post',
              targetId: id,
            },
          },
        }),
        prisma.favorite.findUnique({
          where: {
            userId_postId: {
              userId,
              postId: id,
            },
          },
        }),
      ]);

      isLiked = !!like;
      isFavorited = !!favorite;
    }

    sendSuccess(res, {
      ...postForResponse,
      viewCount: post.viewCount + 1,
      isLiked,
      isFavorited,
    });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '获取帖子详情失败');
  }
}

/**
 * 创建帖子
 */
export async function createPost(req: Request, res: Response) {
  try {
    const userId = (req as any).user!.userId;
    const { title, content, categoryId, images } = req.body;

    // 验证必填字段
    if (!title || !content || !categoryId) {
      sendError(res, ErrorCode.MISSING_REQUIRED_FIELD, '标题、内容和分类不能为空');
      return;
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      sendError(res, ErrorCode.NOT_FOUND, '分类不存在');
      return;
    }

    const authorId = category.isAnonymous
      ? (await getAnonymousUserId()) ?? userId
      : userId;

    const post = await prisma.post.create({
      data: {
        title,
        content,
        categoryId,
        userId: authorId,
        images: images || [],
      },
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
            isAnonymous: true,
          },
        },
      },
    });

    const postResponse = (post as any).category?.isAnonymous
      ? { ...post, user: maskUserForAnonymous((post as any).user, true) }
      : post;

    await prisma.category.update({
      where: { id: categoryId },
      data: { postCount: { increment: 1 } },
    });

    sendSuccess(res, postResponse, '帖子创建成功');
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '创建帖子失败');
  }
}

/**
 * 更新帖子
 */
export async function updatePost(req: Request, res: Response) {
  try {
    const id = getParam(req, 'id');
    if (!id) { sendError(res, ErrorCode.INVALID_INPUT, '无效的ID'); return; }
    const userId = (req as any).user!.userId;
    const { title, content, categoryId, images } = req.body;

    // 查找帖子
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post || post.isDeleted) {
      sendError(res, ErrorCode.NOT_FOUND, '帖子不存在');
      return;
    }

    // 检查权限（只能修改自己的帖子）
    if (post.userId !== userId) {
      sendError(res, ErrorCode.FORBIDDEN, '无权修改此帖子');
      return;
    }

    // 构建更新数据
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (images !== undefined) updateData.images = images;
    if (categoryId !== undefined) {
      // 验证分类是否存在
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        sendError(res, ErrorCode.NOT_FOUND, '分类不存在');
        return;
      }
      updateData.categoryId = categoryId;
    }

    // 更新帖子
    const updatedPost = await prisma.post.update({
      where: { id },
      data: updateData,
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
    });

    sendSuccess(res, updatedPost, '帖子更新成功');
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '更新帖子失败');
  }
}

/**
 * 删除帖子（软删除）
 */
export async function deletePost(req: Request, res: Response) {
  try {
    const id = getParam(req, 'id');
    if (!id) { sendError(res, ErrorCode.INVALID_INPUT, '无效的ID'); return; }
    const userId = (req as any).user!.userId;

    // 查找帖子
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post || post.isDeleted) {
      sendError(res, ErrorCode.NOT_FOUND, '帖子不存在');
      return;
    }

    // 检查权限（只能删除自己的帖子）
    if (post.userId !== userId) {
      sendError(res, ErrorCode.FORBIDDEN, '无权删除此帖子');
      return;
    }

    // 软删除
    await prisma.post.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // 更新分类的帖子数量
    await prisma.category.update({
      where: { id: post.categoryId },
      data: { postCount: { decrement: 1 } },
    });

    sendSuccess(res, { message: '帖子删除成功' });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '删除帖子失败');
  }
}
