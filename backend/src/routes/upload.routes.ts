import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  uploadImageMiddleware,
  uploadFileMiddleware,
  uploadImageHandler,
  uploadFileHandler,
} from '../controllers/upload.controller.js';

const router = Router();

/**
 * POST /api/upload/image
 * 上传图片（需要认证）
 */
router.post('/image', authenticate, uploadImageMiddleware, uploadImageHandler);

/**
 * POST /api/upload/file
 * 上传文件（需要认证）
 */
router.post('/file', authenticate, uploadFileMiddleware, uploadFileHandler);

export default router;
