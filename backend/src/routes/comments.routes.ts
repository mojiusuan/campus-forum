import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from '../controllers/comment.controller.js';
import {
  likeComment,
  unlikeComment,
} from '../controllers/interaction.controller.js';

const router = Router();

/**
 * GET /api/posts/:postId/comments
 * 获取评论列表（无需认证）
 */
router.get('/posts/:postId/comments', getComments);

/**
 * POST /api/posts/:postId/comments
 * 创建评论（需要认证）
 */
router.post('/posts/:postId/comments', authenticate, createComment);

/**
 * PUT /api/comments/:id
 * 更新评论（需要认证）
 */
router.put('/comments/:id', authenticate, updateComment);

/**
 * DELETE /api/comments/:id
 * 删除评论（需要认证）
 */
router.delete('/comments/:id', authenticate, deleteComment);

/**
 * POST /api/comments/:id/like
 * 点赞评论（需要认证）
 */
router.post('/comments/:id/like', authenticate, likeComment);

/**
 * DELETE /api/comments/:id/like
 * 取消点赞评论（需要认证）
 */
router.delete('/comments/:id/like', authenticate, unlikeComment);

export default router;
