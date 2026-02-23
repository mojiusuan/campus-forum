import type { Request, Response } from 'express-serve-static-core';
import { sendSuccess, sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';
import prisma from '../utils/db.js';
import { getParam } from '../utils/params.js';

/**
 * 获取用户信息
 * GET /api/users/:id
 */
export async function getUserById(req: Request, res: Response) {
  try {
    const id = getParam(req, 'id');
    if (!id) { sendError(res, ErrorCode.INVALID_INPUT, '无效的ID'); return; }
    const currentUserId = (req as any).user?.userId; // 可选，用于判断是否关注

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return sendError(res, ErrorCode.NOT_FOUND, '用户不存在');
    }

    if (!user.isActive) {
      return sendError(res, ErrorCode.NOT_FOUND, '用户已被禁用');
    }

    // 统计用户数据
    const [postCount, followerCount, followingCount, isFollowing] = await Promise.all([
      // 帖子数（未删除的）
      prisma.post.count({
        where: {
          userId: id,
          isDeleted: false,
        },
      }),
      // 粉丝数
      prisma.follow.count({
        where: {
          followingId: id,
        },
      }),
      // 关注数
      prisma.follow.count({
        where: {
          followerId: id,
        },
      }),
      // 当前用户是否关注此用户
      currentUserId
        ? prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUserId,
                followingId: id,
              },
            },
          }).then((follow) => !!follow)
        : Promise.resolve(false),
    ]);

    sendSuccess(res, {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      isVerified: user.isVerified,
      postCount,
      followerCount,
      followingCount,
      isFollowing,
      createdAt: user.createdAt,
    });
  } catch (error: any) {
    console.error('获取用户信息失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '获取用户信息失败', error.message);
  }
}

/**
 * 更新用户信息
 * PUT /api/users/:id
 */
export async function updateUser(req: Request, res: Response) {
  try {
    const id = getParam(req, 'id');
    if (!id) { sendError(res, ErrorCode.INVALID_INPUT, '无效的ID'); return; }
    const { username, bio, avatarUrl, phone } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return sendError(res, ErrorCode.UNAUTHORIZED, '请先登录');
    }

    // 验证权限（只能修改自己的信息）
    if (userId !== id) {
      return sendError(res, ErrorCode.FORBIDDEN, '无权修改此用户信息');
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return sendError(res, ErrorCode.NOT_FOUND, '用户不存在');
    }

    // 构建更新数据
    const updateData: any = {};

    if (username !== undefined) {
      // 验证用户名
      if (!username || username.trim().length === 0) {
        return sendError(res, ErrorCode.VALIDATION_ERROR, '用户名不能为空');
      }

      // 用户名长度限制：1-20 个字符
      if (username.length < 1 || username.length > 20) {
        return sendError(res, ErrorCode.VALIDATION_ERROR, '用户名长度必须在1-20个字符之间');
      }

      // 检查用户名是否已被使用（排除当前用户）
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser && existingUser.id !== id) {
        return sendError(res, ErrorCode.ALREADY_EXISTS, '用户名已被使用');
      }

      updateData.username = username.trim();
    }

    if (bio !== undefined) {
      // 验证简介
      if (bio && bio.length > 200) {
        return sendError(res, ErrorCode.VALIDATION_ERROR, '简介不能超过200个字符');
      }
      updateData.bio = bio ? bio.trim() : null;
    }

    if (avatarUrl !== undefined) {
      // 验证头像URL
      if (avatarUrl && avatarUrl.length > 500) {
        return sendError(res, ErrorCode.VALIDATION_ERROR, '头像URL过长');
      }
      updateData.avatarUrl = avatarUrl || null;
    }

    if (phone !== undefined) {
      // 验证手机号
      if (phone) {
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
          return sendError(res, ErrorCode.VALIDATION_ERROR, '手机号格式不正确');
        }

        // 检查手机号是否已被使用（排除当前用户）
        const existingUser = await prisma.user.findUnique({
          where: { phone },
        });

        if (existingUser && existingUser.id !== id) {
          return sendError(res, ErrorCode.ALREADY_EXISTS, '手机号已被使用');
        }
      }
      updateData.phone = phone || null;
    }

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        isVerified: true,
        updatedAt: true,
      },
    });

    sendSuccess(res, updatedUser, '用户信息更新成功');
  } catch (error: any) {
    console.error('更新用户信息失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '更新用户信息失败', error.message);
  }
}
