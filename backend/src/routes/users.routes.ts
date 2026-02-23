import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import {
  getUserById,
  updateUser,
} from '../controllers/user.controller.js';
import {
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
} from '../controllers/follow.controller.js';

const router = Router();

/**
 * GET /api/users/:id
 * 获取用户信息（可选认证，用于判断是否关注）
 */
router.get('/:id', optionalAuthenticate, getUserById);

/**
 * PUT /api/users/:id
 * 更新用户信息（需要认证，只能修改自己的信息）
 */
router.put('/:id', authenticate, updateUser);

/**
 * POST /api/users/:id/follow
 * 关注用户（需要认证）
 */
router.post('/:id/follow', authenticate, followUser);

/**
 * DELETE /api/users/:id/follow
 * 取消关注用户（需要认证）
 */
router.delete('/:id/follow', authenticate, unfollowUser);

/**
 * GET /api/users/:id/following
 * 获取关注列表（可选认证）
 */
router.get('/:id/following', optionalAuthenticate, getFollowing);

/**
 * GET /api/users/:id/followers
 * 获取粉丝列表（可选认证）
 */
router.get('/:id/followers', optionalAuthenticate, getFollowers);

export default router;
