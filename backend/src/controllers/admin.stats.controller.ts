import type { Request, Response } from 'express-serve-static-core';
import { sendSuccess, sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';
import prisma from '../utils/db.js';

/**
 * 获取概览统计
 * GET /api/admin/stats/overview
 */
export async function getOverview(req: Request, res: Response) {
  try {
    // 普通管理员统计中不包含超级管理员
    const userCountWhere: any = { isActive: true };
    if (req.user?.role === 'admin') {
      userCountWhere.role = { not: 'super_admin' };
    }

    // 获取用户总数
    const totalUsers = await prisma.user.count({
      where: userCountWhere,
    });

    // 获取活跃用户数（30天内登录）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await prisma.user.count({
      where: {
        ...userCountWhere,
        lastLoginAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // 获取帖子总数
    const totalPosts = await prisma.post.count({
      where: { isDeleted: false },
    });

    // 获取今日新增帖子
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPosts = await prisma.post.count({
      where: {
        isDeleted: false,
        createdAt: {
          gte: today,
        },
      },
    });

    // 获取评论总数
    const totalComments = await prisma.comment.count({
      where: { isDeleted: false },
    });

    // 获取今日新增评论
    const todayComments = await prisma.comment.count({
      where: {
        isDeleted: false,
        createdAt: {
          gte: today,
        },
      },
    });

    // 获取分类数量
    const totalCategories = await prisma.category.count({
      where: { isActive: true },
    });

    sendSuccess(res, {
      totalUsers,
      activeUsers,
      totalPosts,
      todayPosts,
      totalComments,
      todayComments,
      totalCategories,
    });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '获取统计数据失败');
  }
}

/**
 * 获取用户统计（趋势）
 * GET /api/admin/stats/users
 */
export async function getUserStats(req: Request, res: Response) {
  try {
    const period = (req.query.period as string) || '30d';
    
    let startDate: Date;
    const endDate = new Date();
    
    switch (period) {
      case '7d':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate = new Date(0); // 全部
    }

    // 按天统计用户注册数（普通管理员不包含超级管理员）
    const userStatsWhere: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };
    if (req.user?.role === 'admin') {
      userStatsWhere.role = { not: 'super_admin' };
    }
    const users = await prisma.user.findMany({
      where: userStatsWhere,
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // 按日期分组统计
    const dailyStats: Record<string, number> = {};
    users.forEach((user) => {
      const date = user.createdAt.toISOString().split('T')[0];
      dailyStats[date] = (dailyStats[date] || 0) + 1;
    });

    // 转换为数组格式
    const trends = Object.entries(dailyStats).map(([date, count]) => ({
      date,
      count,
    }));

    sendSuccess(res, {
      period,
      trends,
      total: users.length,
    });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '获取用户统计失败');
  }
}

/**
 * 获取帖子统计（趋势）
 * GET /api/admin/stats/posts
 */
export async function getPostStats(req: Request, res: Response) {
  try {
    const period = (req.query.period as string) || '30d';
    
    let startDate: Date;
    const endDate = new Date();
    
    switch (period) {
      case '7d':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate = new Date(0); // 全部
    }

    const posts = await prisma.post.findMany({
      where: {
        isDeleted: false,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // 按日期分组统计
    const dailyStats: Record<string, number> = {};
    posts.forEach((post) => {
      const date = post.createdAt.toISOString().split('T')[0];
      dailyStats[date] = (dailyStats[date] || 0) + 1;
    });

    const trends = Object.entries(dailyStats).map(([date, count]) => ({
      date,
      count,
    }));

    sendSuccess(res, {
      period,
      trends,
      total: posts.length,
    });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '获取帖子统计失败');
  }
}

/**
 * 获取分类统计
 * GET /api/admin/stats/categories
 */
export async function getCategoryStats(req: Request, res: Response) {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            posts: {
              where: {
                isDeleted: false,
              },
            },
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    const stats = categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      postCount: category._count.posts,
    }));

    sendSuccess(res, {
      categories: stats,
      total: categories.length,
    });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '获取分类统计失败');
  }
}
