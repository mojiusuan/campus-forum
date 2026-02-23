import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';
import { generateToken } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import prisma from '../utils/db.js';

const router = Router();

/**
 * POST /api/auth/register
 * 用户注册
 */
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, phone } = req.body;

    // 验证必填字段
    if (!email || !username || !password) {
      sendError(res, ErrorCode.MISSING_REQUIRED_FIELD, '缺少必填字段');
      return;
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      sendError(res, ErrorCode.ALREADY_EXISTS, '邮箱或用户名已存在');
      return;
    }

    // 加密密码
    const passwordHash = await hashPassword(password);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        phone: phone || null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });

    // 生成Token（包含角色信息）
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: 'user', // 新注册用户默认为普通用户
    });

    sendSuccess(res, {
      user: {
        ...user,
        role: 'user',
        isAdmin: false,
      },
      token,
    });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '注册失败');
  }
});

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      sendError(res, ErrorCode.MISSING_REQUIRED_FIELD, '邮箱和密码不能为空');
      return;
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      sendError(res, ErrorCode.NOT_FOUND, '邮箱或密码错误');
      return;
    }

    // 检查用户是否被封禁
    if (!user.isActive) {
      sendError(res, ErrorCode.FORBIDDEN, '账户已被封禁，无法登录', undefined, 403);
      return;
    }

    // 验证密码
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      sendError(res, ErrorCode.NOT_FOUND, '邮箱或密码错误');
      return;
    }

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 生成Token（包含角色信息）
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        isVerified: user.isVerified,
        role: user.role,
        isAdmin: user.isAdmin,
      },
      token,
    });
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '登录失败');
  }
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        username: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        isVerified: true,
        role: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      sendError(res, ErrorCode.NOT_FOUND, '用户不存在');
      return;
    }

    sendSuccess(res, user);
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message || '获取用户信息失败');
  }
});

/**
 * POST /api/auth/logout
 * 用户登出（客户端删除Token即可）
 */
router.post('/logout', authenticate, (req, res) => {
  sendSuccess(res, { message: '登出成功' });
});

export default router;
