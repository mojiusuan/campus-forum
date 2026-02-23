import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getConversations,
  getConversation,
  sendMessage,
  markMessageAsRead,
  getUnreadCount,
} from '../controllers/message.controller.js';

const router = Router();

/**
 * GET /api/conversations
 * 获取对话列表（需要认证）
 */
router.get('/conversations', authenticate, getConversations);

/**
 * GET /api/conversations/:userId
 * 获取对话详情（需要认证）
 */
router.get('/conversations/:userId', authenticate, getConversation);

/**
 * POST /api/conversations/:userId/messages
 * 发送消息（需要认证）
 */
router.post('/conversations/:userId/messages', authenticate, sendMessage);

/**
 * PUT /api/messages/:id/read
 * 标记消息已读（需要认证）
 */
router.put('/messages/:id/read', authenticate, markMessageAsRead);

/**
 * GET /api/messages/unread-count
 * 获取未读消息数（需要认证）
 */
router.get('/messages/unread-count', authenticate, getUnreadCount);

export default router;
