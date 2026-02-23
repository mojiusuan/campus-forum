import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} from '../controllers/notification.controller.js';

const router = Router();

/**
 * GET /api/notifications
 * 获取通知列表（需要认证）
 */
router.get('/', authenticate, getNotifications);

/**
 * PUT /api/notifications/:id/read
 * 标记通知已读（需要认证）
 */
router.put('/:id/read', authenticate, markNotificationAsRead);

/**
 * PUT /api/notifications/read-all
 * 标记所有通知已读（需要认证）
 */
router.put('/read-all', authenticate, markAllNotificationsAsRead);

/**
 * GET /api/notifications/unread-count
 * 获取未读通知数（需要认证）
 */
router.get('/unread-count', authenticate, getUnreadNotificationCount);

export default router;
