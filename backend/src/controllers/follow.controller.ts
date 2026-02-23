import type { Request, Response } from 'express-serve-static-core';
import { sendSuccess, sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';
import prisma from '../utils/db.js';

/**
 * 关注用户
 * POST /api/users/:id/follow
 */
export async function followUser(req: Request, res: Response) {
  try {
    const { id: followingId } = req.params;
    const followerId = (req as any).user?.userId;

    if (!followerId) {
      return sendError(res, ErrorCode.UNAUTHORIZED, '请先登录');
    }

    // 不能关注自己
    if (followerId === followingId) {
      return sendError(res, ErrorCode.VALIDATION_ERROR, '不能关注自己');
    }

    // 验证被关注用户是否存在
    const followingUser = await prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!followingUser) {
      return sendError(res, ErrorCode.NOT_FOUND, '用户不存在');
    }

    if (!followingUser.isActive) {
      return sendError(res, ErrorCode.FORBIDDEN, '用户已被禁用');
    }

    // 检查是否已关注
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      return sendError(res, ErrorCode.ALREADY_EXISTS, '已经关注过了');
    }

    // 创建关注关系
    await prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    sendSuccess(res, {
      isFollowing: true,
    }, '关注成功');
  } catch (error: any) {
    console.error('关注用户失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '关注失败', error.message);
  }
}

/**
 * 取消关注用户
 * DELETE /api/users/:id/follow
 */
export async function unfollowUser(req: Request, res: Response) {
  try {
    const { id: followingId } = req.params;
    const followerId = (req as any).user?.userId;

    if (!followerId) {
      return sendError(res, ErrorCode.UNAUTHORIZED, '请先登录');
    }

    // 验证被关注用户是否存在
    const followingUser = await prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!followingUser) {
      return sendError(res, ErrorCode.NOT_FOUND, '用户不存在');
    }

    // 检查是否已关注
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!existingFollow) {
      return sendError(res, ErrorCode.NOT_FOUND, '还没有关注');
    }

    // 删除关注关系
    await prisma.follow.delete({
      where: {
        id: existingFollow.id,
      },
    });

    sendSuccess(res, {
      isFollowing: false,
    }, '取消关注成功');
  } catch (error: any) {
    console.error('取消关注失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '取消关注失败', error.message);
  }
}

/**
 * 获取关注列表
 * GET /api/users/:id/following
 */
export async function getFollowing(req: Request, res: Response) {
  try {
    const { id: userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // 验证用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return sendError(res, ErrorCode.NOT_FOUND, '用户不存在');
    }

    // 获取关注列表
    const [follows, total] = await Promise.all([
      prisma.follow.findMany({
        where: {
          followerId: userId,
        },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              bio: true,
              isVerified: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.follow.count({
        where: {
          followerId: userId,
        },
      }),
    ]);

    // 格式化响应数据
    const following = follows.map((follow) => ({
      id: follow.following.id,
      username: follow.following.username,
      avatarUrl: follow.following.avatarUrl,
      bio: follow.following.bio,
      isVerified: follow.following.isVerified,
      followedAt: follow.createdAt,
    }));

    sendSuccess(res, {
      following,
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
    console.error('获取关注列表失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '获取关注列表失败', error.message);
  }
}

/**
 * 获取粉丝列表
 * GET /api/users/:id/followers
 */
export async function getFollowers(req: Request, res: Response) {
  try {
    const { id: userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const currentUserId = (req as any).user?.userId; // 可选，用于判断是否关注

    // 验证用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return sendError(res, ErrorCode.NOT_FOUND, '用户不存在');
    }

    // 获取粉丝列表
    const [follows, total] = await Promise.all([
      prisma.follow.findMany({
        where: {
          followingId: userId,
        },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              bio: true,
              isVerified: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.follow.count({
        where: {
          followingId: userId,
        },
      }),
    ]);

    // 获取当前用户关注的用户ID列表（用于判断是否互相关注）
    let followingIds: string[] = [];
    if (currentUserId) {
      const currentUserFollows = await prisma.follow.findMany({
        where: {
          followerId: currentUserId,
        },
        select: {
          followingId: true,
        },
      });
      followingIds = currentUserFollows.map((f) => f.followingId);
    }

    // 格式化响应数据
    const followers = follows.map((follow) => ({
      id: follow.follower.id,
      username: follow.follower.username,
      avatarUrl: follow.follower.avatarUrl,
      bio: follow.follower.bio,
      isVerified: follow.follower.isVerified,
      followedAt: follow.createdAt,
      isFollowing: currentUserId ? followingIds.includes(follow.follower.id) : false,
    }));

    sendSuccess(res, {
      followers,
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
    console.error('获取粉丝列表失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '获取粉丝列表失败', error.message);
  }
}
