import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import * as statsController from '../controllers/admin.stats.controller.js';
import * as postController from '../controllers/admin.post.controller.js';
import * as commentController from '../controllers/admin.comment.controller.js';
import * as userController from '../controllers/admin.user.controller.js';
import * as categoryController from '../controllers/admin.category.controller.js';
import * as resourceController from '../controllers/admin.resource.controller.js';
import * as logController from '../controllers/admin.log.controller.js';

const router = Router();

// 所有管理员路由都需要认证和管理员权限
router.use(authenticate);
router.use(requireAdmin);

// 统计相关路由
router.get('/stats/overview', statsController.getOverview);
router.get('/stats/users', statsController.getUserStats);
router.get('/stats/posts', statsController.getPostStats);
router.get('/stats/categories', statsController.getCategoryStats);

// 帖子管理路由
router.get('/posts', postController.getPosts);
router.delete('/posts/:id', postController.deletePost);
router.post('/posts/:id/restore', postController.restorePost);
router.post('/posts/:id/pin', postController.pinPost);
router.delete('/posts/:id/pin', postController.unpinPost);
router.post('/posts/:id/lock', postController.lockPost);
router.delete('/posts/:id/lock', postController.unlockPost);

// 评论管理路由
router.get('/comments', commentController.getComments);
router.delete('/comments/:id', commentController.deleteComment);
router.post('/comments/:id/restore', commentController.restoreComment);

// 用户管理路由
router.get('/users', userController.getUsers);
router.get('/users/:id', userController.getUserById);
router.post('/users/:id/ban', userController.banUser);
router.post('/users/:id/unban', userController.unbanUser);
router.put('/users/:id', userController.updateUser);
router.post('/users/:id/reset-password', userController.resetPassword);

// 分类管理路由
router.get('/categories', categoryController.getCategories);
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);
router.post('/categories/reorder', categoryController.reorderCategories);

// 学习资料管理路由
router.get('/resources', resourceController.getResources);
router.delete('/resources/:id', resourceController.deleteResource);
router.post('/resources/:id/restore', resourceController.restoreResource);

// 操作日志路由
router.get('/logs', logController.getLogs);

export default router;
