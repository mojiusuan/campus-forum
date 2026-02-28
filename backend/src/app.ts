import 'dotenv/config'; // 必须最先加载，确保 db 等模块能读取到 .env
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { sendSuccess, sendError } from './utils/response.js';
import { ErrorCode } from './types/api.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 路由
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import postsRoutes from './routes/posts.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import commentsRoutes from './routes/comments.routes.js';
import messagesRoutes from './routes/messages.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import searchRoutes from './routes/search.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import resourcesRoutes from './routes/resources.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 配置：
// - 开发环境：允许任意来源（方便本机 + 局域网手机调试）
// - 生产环境：仅允许环境变量中配置的来源（支持多个，用逗号分隔）
const allowedOrigins =
  process.env.CORS_ORIGIN
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) || ['http://localhost:5173'];

// 中间件
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? allowedOrigins : true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（用于访问上传的文件）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 健康检查
app.get('/api/health', (req, res) => {
  sendSuccess(res, {
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api', commentsRoutes); // 评论路由（包含 /api/posts/:postId/comments 和 /api/comments/:id）
app.use('/api', messagesRoutes); // 私信路由（包含 /api/conversations 和 /api/messages）
app.use('/api/notifications', notificationsRoutes); // 通知路由
app.use('/api/search', searchRoutes); // 搜索路由
app.use('/api/upload', uploadRoutes); // 文件上传路由
app.use('/api/resources', resourcesRoutes); // 学习资料路由
app.use('/api/reports', reportsRoutes); // 举报
app.use('/api/admin', adminRoutes); // 管理员路由

// 404处理
app.use((req, res) => {
  sendError(res, ErrorCode.NOT_FOUND, 'Route not found', undefined, 404);
});

// 错误处理中间件（必须放在最后）
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📚 API文档: http://localhost:${PORT}/api/health`);
});

export default app;
