import type { Request, Response } from 'express-serve-static-core';
import { sendSuccess, sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';
import prisma from '../utils/db.js';
import { logAdminAction } from '../utils/adminLog.js';
import { hashPassword } from '../utils/password.js';

/**
 * 获取用户列表
 * GET /api/admin/users
 */
export async function getUsers(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const keyword = req.query.keyword as string | undefined;
    const role = req.query.role as string | undefined;
    const status = req.query.status as string | undefined; // 'all' | 'active' | 'banned'

    // 构建查询条件
    const where: any = {};

    // 状态筛选
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'banned') {
      where.isActive = false;
    }
    // 'all' 或未指定：显示所有

    if (role) {
      where.role = role;
    }

    if (keyword) {
      where.OR = [
        { username: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    // 查询用户
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          avatarUrl: true,
          bio: true,
          isVerified: true,
          isActive: true,
          role: true,
          isAdmin: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              posts: {
                where: {
                  isDeleted: false,
                },
              },
              comments: {
                where: {
                  isDeleted: false,
                },
              },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // 格式化用户数据
    const formattedUsers = users.map((user) => ({
      ...user,
      postCount: user._count.posts,
      commentCount: user._count.comments,
    }));

    const totalPages = Math.ceil(total / limit);

    sendSuccess(res, {
      users: formattedUsers,
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
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '获取用户列表失败');
  }
}

/**
 * 获取用户详情
 * GET /api/admin/users/:id
 */
export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        isVerified: true,
        isActive: true,
        role: true,
        isAdmin: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            posts: {
              where: {
                isDeleted: false,
              },
            },
            comments: {
              where: {
                isDeleted: false,
              },
            },
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      sendError(res, ErrorCode.NOT_FOUND, '用户不存在');
      return;
    }

    // 获取用户最近的帖子（10条）
    const recentPosts = await prisma.post.findMany({
      where: {
        userId: id,
        isDeleted: false,
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        viewCount: true,
        likeCount: true,
        commentCount: true,
      },
    });

    // 获取用户最近的评论（10条）
    const recentComments = await prisma.comment.findMany({
      where: {
        userId: id,
        isDeleted: false,
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        postId: true,
        createdAt: true,
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    sendSuccess(res, {
      user: {
        ...user,
        postCount: user._count.posts,
        commentCount: user._count.comments,
        followerCount: user._count.followers,
        followingCount: user._count.following,
      },
      recentPosts,
      recentComments,
    });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '获取用户详情失败');
  }
}

/**
 * 封禁用户
 * POST /api/admin/users/:id/ban
 */
export async function banUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      sendError(res, ErrorCode.NOT_FOUND, '用户不存在');
      return;
    }

    if (!user.isActive) {
      sendError(res, ErrorCode.VALIDATION_ERROR, '用户已被封禁');
      return;
    }

    // 不能封禁超级管理员
    if (user.role === 'super_admin') {
      sendError(res, ErrorCode.FORBIDDEN, '不能封禁超级管理员');
      return;
    }

    // 普通管理员不能封禁其他管理员
    const adminUser = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    });

    if (adminUser?.role === 'admin' && (user.role === 'admin' || user.role === 'super_admin')) {
      sendError(res, ErrorCode.FORBIDDEN, '普通管理员不能封禁其他管理员');
      return;
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await logAdminAction({
      adminId,
      action: 'ban_user',
      targetType: 'user',
      targetId: id,
      description: `封禁用户: ${user.username}${reason ? `, 原因: ${reason}` : ''}`,
      req,
    });

    sendSuccess(res, { message: '用户已封禁' });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '封禁用户失败');
  }
}

/**
 * 解封用户
 * POST /api/admin/users/:id/unban
 */
export async function unbanUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const adminId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      sendError(res, ErrorCode.NOT_FOUND, '用户不存在');
      return;
    }

    if (user.isActive) {
      sendError(res, ErrorCode.VALIDATION_ERROR, '用户未被封禁');
      return;
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    await logAdminAction({
      adminId,
      action: 'unban_user',
      targetType: 'user',
      targetId: id,
      description: `解封用户: ${user.username}`,
      req,
    });

    sendSuccess(res, { message: '用户已解封' });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '解封用户失败');
  }
}

/**
 * 更新用户信息
 * PUT /api/admin/users/:id
 */
export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { username, email, role, isActive } = req.body;
    const adminId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      sendError(res, ErrorCode.NOT_FOUND, '用户不存在');
      return;
    }

    // 权限检查
    const adminUser = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    });

    // 不能修改超级管理员
    if (user.role === 'super_admin' && adminUser?.role !== 'super_admin') {
      sendError(res, ErrorCode.FORBIDDEN, '不能修改超级管理员');
      return;
    }

    // 普通管理员不能修改其他管理员的角色
    if (adminUser?.role === 'admin' && role && (user.role === 'admin' || user.role === 'super_admin')) {
      sendError(res, ErrorCode.FORBIDDEN, '普通管理员不能修改其他管理员的角色');
      return;
    }

    // 不能将用户设置为超级管理员（除非当前用户是超级管理员）
    if (role === 'super_admin' && adminUser?.role !== 'super_admin') {
      sendError(res, ErrorCode.FORBIDDEN, '只有超级管理员可以设置超级管理员角色');
      return;
    }

    const updateData: any = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) {
      updateData.role = role;
      updateData.isAdmin = role === 'admin' || role === 'super_admin';
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    await logAdminAction({
      adminId,
      action: 'update_user',
      targetType: 'user',
      targetId: id,
      description: `更新用户信息: ${user.username}`,
      req,
    });

    sendSuccess(res, { message: '用户信息已更新' });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '更新用户信息失败');
  }
}

/**
 * 重置用户密码
 * POST /api/admin/users/:id/reset-password
 */
export async function resetPassword(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const adminId = req.user!.userId;

    if (!newPassword || newPassword.length < 6) {
      sendError(res, ErrorCode.VALIDATION_ERROR, '密码长度至少6位');
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      sendError(res, ErrorCode.NOT_FOUND, '用户不存在');
      return;
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await logAdminAction({
      adminId,
      action: 'reset_password',
      targetType: 'user',
      targetId: id,
      description: `重置用户密码: ${user.username}`,
      req,
    });

    sendSuccess(res, { message: '密码已重置' });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '重置密码失败');
  }
}
