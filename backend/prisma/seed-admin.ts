import "dotenv/config";
import prisma from '../src/utils/db.js';
import { hashPassword } from '../src/utils/password.js';

async function main() {
  console.log('🌱 开始创建管理员账号...');

  // 创建超级管理员
  const superAdminEmail = 'admin@forum.edu';
  const superAdminPassword = 'admin123456'; // 请在生产环境中修改此密码

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (!existingSuperAdmin) {
    const superAdmin = await prisma.user.create({
      data: {
        email: superAdminEmail,
        username: 'admin',
        passwordHash: await hashPassword(superAdminPassword),
        role: 'super_admin',
        isAdmin: true,
        isVerified: true,
        isActive: true,
      },
    });
    console.log(`✅ 创建超级管理员: ${superAdmin.email} (密码: ${superAdminPassword})`);
  } else {
    // 更新现有用户为超级管理员
    await prisma.user.update({
      where: { id: existingSuperAdmin.id },
      data: {
        role: 'super_admin',
        isAdmin: true,
      },
    });
    console.log(`✅ 更新用户为超级管理员: ${superAdminEmail}`);
  }

  // 创建普通管理员（可选）
  const adminEmail = 'moderator@forum.edu';
  const adminPassword = 'moderator123456'; // 请在生产环境中修改此密码

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        username: 'moderator',
        passwordHash: await hashPassword(adminPassword),
        role: 'admin',
        isAdmin: true,
        isVerified: true,
        isActive: true,
      },
    });
    console.log(`✅ 创建管理员: ${admin.email} (密码: ${adminPassword})`);
  } else {
    // 更新现有用户为管理员
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        role: 'admin',
        isAdmin: true,
      },
    });
    console.log(`✅ 更新用户为管理员: ${adminEmail}`);
  }

  console.log('✅ 管理员账号创建完成！');
  console.log('⚠️  请在生产环境中立即修改默认密码！');
}

main()
  .catch((e) => {
    console.error('❌ 管理员账号创建失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
