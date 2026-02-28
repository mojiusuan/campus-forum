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
 * 用户注册（需上传学生证，待管理员审核通过后才能登录）
 */
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, phone, studentIdImageUrl } = req.body;

    // 验证必填字段（含学生证照片）
    if (!email || !username || !password) {
      sendError(res, ErrorCode.MISSING_REQUIRED_FIELD, '缺少必填字段');
      return;
    }
    if (!studentIdImageUrl || typeof studentIdImageUrl !== 'string' || !studentIdImageUrl.trim()) {
      sendError(res, ErrorCode.MISSING_REQUIRED_FIELD, '请上传学生证照片');
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

    // 创建用户（待审核状态，不发放 token）
    await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        phone: phone || null,
        verificationStatus: 'pending',
        studentIdImageUrl: studentIdImageUrl.trim(),
      },
    });

    sendSuccess(res, {
      message: '注册成功，请等待管理员审核。审核通过后可登录使用。',
      pending: true,
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
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
        avatarUrl: true,
        bio: true,
        isVerified: true,
        isActive: true,
        role: true,
        isAdmin: true,
        verificationStatus: true,
      },
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

    // 检查是否已通过学生证审核（管理员/超级管理员不受限）
    const needVerification = user.role === 'user';
    if (needVerification && user.verificationStatus !== 'approved') {
      if (user.verificationStatus === 'rejected') {
        sendError(res, ErrorCode.FORBIDDEN, '您的注册审核未通过，无法登录', undefined, 403);
      } else {
        sendError(res, ErrorCode.FORBIDDEN, '您的账号尚未通过审核，请耐心等待管理员审核', undefined, 403);
      }
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
        verificationStatus: true,
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
