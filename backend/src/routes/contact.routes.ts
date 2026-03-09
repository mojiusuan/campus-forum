import { Router } from 'express';
import { createContactMessage } from '../controllers/contact.controller.js';

const router = Router();

// 公开联系我们接口（无需登录）
router.post('/', createContactMessage);

export default router;

