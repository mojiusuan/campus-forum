import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// 创建 PostgreSQL 连接池
const connectionString = process.env.DATABASE_URL || 'postgresql://forum_user:54TFD99M@localhost:5432/forum?schema=public';
const pool = new Pool({
  connectionString,
  max: parseInt(process.env.DB_POOL_MAX || '20'), // 最大连接数（根据服务器配置调整）
  min: parseInt(process.env.DB_POOL_MIN || '5'), // 最小连接数
  idleTimeoutMillis: 30000, // 空闲连接超时（30秒）
  connectionTimeoutMillis: 2000, // 连接超时（2秒）
  // 生产环境建议配置
  ...(process.env.NODE_ENV === 'production' && {
    max: parseInt(process.env.DB_POOL_MAX || '50'),
    min: parseInt(process.env.DB_POOL_MIN || '10'),
  }),
});

// 创建 Prisma PostgreSQL 适配器
const adapter = new PrismaPg(pool);

// Prisma Client单例
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// 优雅关闭
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  await pool.end();
});

export default prisma;
