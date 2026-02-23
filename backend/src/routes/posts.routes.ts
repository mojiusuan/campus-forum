import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
} from '../controllers/post.controller.js';
import { searchPosts } from '../controllers/search.controller.js';
import {
  likePost,
  unlikePost,
  favoritePost,
  unfavoritePost,
} from '../controllers/interaction.controller.js';

const router = Router();

/**
 * GET /api/posts
 * 获取帖子列表（可选认证）
 */
router.get('/', optionalAuthenticate, getPosts);

/**
 * GET /api/posts/search
 * 搜索帖子（可选认证）- 必须在 /:id 之前
 */
router.get('/search', optionalAuthenticate, searchPosts);

/**
 * POST /api/posts
 * 创建帖子（需要认证）
 */
router.post('/', authenticate, createPost);

/**
 * POST /api/posts/:id/like
 * 点赞帖子（需要认证）- 必须在 /:id 之前
 */
router.post('/:id/like', authenticate, likePost);

/**
 * DELETE /api/posts/:id/like
 * 取消点赞帖子（需要认证）- 必须在 /:id 之前
 */
router.delete('/:id/like', authenticate, unlikePost);

/**
 * POST /api/posts/:id/favorite
 * 收藏帖子（需要认证）- 必须在 /:id 之前
 */
router.post('/:id/favorite', authenticate, favoritePost);

/**
 * DELETE /api/posts/:id/favorite
 * 取消收藏帖子（需要认证）- 必须在 /:id 之前
 */
router.delete('/:id/favorite', authenticate, unfavoritePost);

/**
 * GET /api/posts/:id
 * 获取帖子详情（可选认证）
 */
router.get('/:id', optionalAuthenticate, getPostById);

/**
 * PUT /api/posts/:id
 * 更新帖子（需要认证）
 */
router.put('/:id', authenticate, updatePost);

/**
 * DELETE /api/posts/:id
 * 删除帖子（需要认证）
 */
router.delete('/:id', authenticate, deletePost);

export default router;
