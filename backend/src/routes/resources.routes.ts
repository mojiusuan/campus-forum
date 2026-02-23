import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import {
  getResources,
  getResourceById,
  createResource,
  deleteResource,
  downloadResource,
} from '../controllers/resource.controller.js';
import { uploadFileMiddleware } from '../controllers/upload.controller.js';

const router = Router();

/**
 * GET /api/resources
 * 获取资料列表（可选认证，未登录只能看到公开资料）
 */
router.get('/', optionalAuthenticate, getResources);

/**
 * GET /api/resources/:id
 * 获取资料详情（可选认证，私有资料需要登录）
 */
router.get('/:id', optionalAuthenticate, getResourceById);

/**
 * POST /api/resources
 * 上传资料（需要认证）
 */
router.post('/', authenticate, uploadFileMiddleware, createResource);

/**
 * DELETE /api/resources/:id
 * 删除资料（需要认证，只能删除自己的资料）
 */
router.delete('/:id', authenticate, deleteResource);

/**
 * POST /api/resources/:id/download
 * 下载资料（可选认证，私有资料需要登录）
 */
router.post('/:id/download', optionalAuthenticate, downloadResource);

export default router;
