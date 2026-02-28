import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  uploadImageMiddleware,
  uploadFileMiddleware,
  uploadStudentIdMiddleware,
  uploadImageHandler,
  uploadFileHandler,
  uploadStudentIdHandler,
} from '../controllers/upload.controller.js';

const router = Router();

/**
 * POST /api/upload/student-id
 * 上传学生证照片（无需登录，供注册使用）
 */
router.post('/student-id', uploadStudentIdMiddleware, uploadStudentIdHandler);

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
