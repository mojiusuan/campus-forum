import { Router } from 'express';
import { optionalAuthenticate } from '../middleware/auth.js';
import {
  searchPosts,
  searchUsers,
  searchAll,
} from '../controllers/search.controller.js';

const router = Router();

/**
 * GET /api/search/posts
 * 搜索帖子（可选认证）
 */
router.get('/posts', optionalAuthenticate, searchPosts);

/**
 * GET /api/search/users
 * 搜索用户（可选认证）
 */
router.get('/users', optionalAuthenticate, searchUsers);

/**
 * GET /api/search
 * 统一搜索接口（可选认证）
 * 查询参数：
 * - keyword: 搜索关键词（必填）
 * - type: 搜索类型（可选，'posts' | 'users' | 'all'，默认'all'）
 * - categoryId: 分类ID（可选，仅用于搜索帖子）
 * - page: 页码（可选）
 * - limit: 每页数量（可选）
 */
router.get('/', optionalAuthenticate, searchAll);

export default router;
