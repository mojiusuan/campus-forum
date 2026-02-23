#!/bin/bash
# 服务器端部署脚本 - 在 /var/www/forum 目录下执行
# 使用前请修改下方的配置变量

set -e

# ========== 请修改以下配置 ==========
GIT_REPO=""           # 例如: https://github.com/你的用户名/forum.git
JWT_SECRET=""         # 从 部署凭证-请妥善保管.md 复制
DB_PASSWORD=""        # 从 部署凭证-请妥善保管.md 复制（注意URL编码：+ → %2B, / → %2F）
DOMAIN=""             # 例如: forum.example.com （没有域名则留空，使用IP）
API_DOMAIN=""         # 例如: api.forum.example.com （没有则留空）
# ===================================

if [ -z "$GIT_REPO" ] || [ -z "$JWT_SECRET" ] || [ -z "$DB_PASSWORD" ]; then
  echo "错误：请先编辑此脚本，填写 GIT_REPO、JWT_SECRET、DB_PASSWORD"
  exit 1
fi

echo "=== 1. 安装 Node.js 20 ==="
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
node -v

echo "=== 2. 安装 PostgreSQL ==="
if ! command -v psql &> /dev/null; then
  sudo apt install -y postgresql postgresql-contrib
  sudo systemctl start postgresql
  sudo systemctl enable postgresql
fi

echo "=== 3. 安装 Nginx ==="
if ! command -v nginx &> /dev/null; then
  sudo apt install -y nginx
  sudo systemctl start nginx
  sudo systemctl enable nginx
fi

echo "=== 4. 安装 PM2 ==="
if ! command -v pm2 &> /dev/null; then
  sudo npm install -g pm2
  pm2 startup
fi

echo "=== 5. 创建目录 ==="
sudo mkdir -p /var/www/forum /var/log/forum
sudo chown -R $USER:$USER /var/www/forum /var/log/forum

echo "=== 6. 配置数据库 ==="
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'forum'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE DATABASE forum;"
sudo -u postgres psql -c "CREATE USER forum_user WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE forum TO forum_user;"
sudo -u postgres psql -c "ALTER USER forum_user CREATEDB;"

echo "=== 7. 克隆/更新代码 ==="
cd /var/www/forum
if [ -d ".git" ]; then
  git pull
else
  git clone $GIT_REPO .
fi

echo "=== 8. 部署后端 ==="
cd backend
npm install --production
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://forum_user:${DB_PASSWORD//+/%2B}@localhost:5432/forum?schema=public
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
CORS_ORIGIN=${DOMAIN:+https://$DOMAIN}
DB_POOL_MAX=20
DB_POOL_MIN=5
LOG_LEVEL=info
EOF
npx prisma generate
npx prisma migrate deploy
npx tsx prisma/seed-admin.ts 2>/dev/null || true
npm run build
pm2 delete forum-api 2>/dev/null || true
pm2 start dist/app.js --name forum-api
pm2 save

echo "=== 9. 部署前端 ==="
cd ../frontend
npm install
if [ -n "$DOMAIN" ]; then
  echo "VITE_API_URL=https://$API_DOMAIN" > .env.production
else
  echo "VITE_API_URL=http://$(curl -s ifconfig.me):3000" > .env.production
fi
npm run build

echo "=== 部署完成 ==="
echo "请手动配置 Nginx 并执行: sudo nginx -t && sudo systemctl reload nginx"
echo "API 健康检查: curl http://localhost:3000/api/health"
