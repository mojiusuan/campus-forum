import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as reportController from '../controllers/report.controller.js';

const router = Router();

router.post('/', authenticate, reportController.createReport);

export default router;
