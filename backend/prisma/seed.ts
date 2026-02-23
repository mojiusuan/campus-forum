import "dotenv/config";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始创建种子数�?..');

  // 创建初始分类
  const categories = [
    {
      name: '学习',
      slug: 'study',
      description: '学习相关话题，包括课程讨论、学习资料分享、考试经验�?,
      icon: '📚',
      color: '#3b82f6',
      sortOrder: 1,
    },
    {
      name: '生活',
      slug: 'life',
      description: '生活相关话题，包括校园生活、日常分享、生活技巧等',
      icon: '🏠',
      color: '#10b981',
      sortOrder: 2,
    },
    {
      name: '娱乐',
      slug: 'entertainment',
      description: '娱乐相关话题，包括游戏、电影、音乐、体育等',
      icon: '🎮',
      color: '#f59e0b',
      sortOrder: 3,
    },
    {
      name: '交易',
      slug: 'trade',
      description: '交易信息发布，包括出售、求购、交换等',
      icon: '💰',
      color: '#ef4444',
      sortOrder: 4,
    },
    {
      name: '活动',
      slug: 'activity',
      description: '活动组织，包括社团活动、聚会、比赛等',
      icon: '🎉',
      color: '#8b5cf6',
      sortOrder: 5,
    },
    {
      name: '其他',
      slug: 'other',
      description: '其他话题',
      icon: '📌',
      color: '#6b7280',
      sortOrder: 6,
    },
  ];

  for (const category of categories) {
    const existing = await prisma.category.findUnique({
      where: { slug: category.slug },
    });

    if (!existing) {
      await prisma.category.create({
        data: category,
      });
      console.log(`�?创建分类: ${category.name}`);
    } else {
      console.log(`⏭️  分类已存�? ${category.name}`);
    }
  }

  console.log('�?种子数据创建完成�?);
}

main()
  .catch((e) => {
    console.error('�?种子数据创建失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
