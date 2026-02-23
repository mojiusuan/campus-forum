# 校园论坛项目

一个专为大学校园设计的论坛平台，解决学生之间信息分散、沟通不便的痛点。

## 📋 项目概述

### 项目信息
- **项目名称：** 校园论坛平台
- **开发周期：** 4个月（MVP阶段）
- **时间投入：** 每天2小时，每周14小时
- **技术栈：** React + TypeScript + Node.js + PostgreSQL

### 项目结构
```
forum/
├── frontend/          # 前端项目（React + TypeScript + Vite）
├── backend/           # 后端项目（Node.js + Express + TypeScript）
├── docs/              # 项目文档
└── README.md          # 项目说明
```

---

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### 前端开发

```bash
# 进入前端目录
cd frontend

# 安装依赖（首次运行）
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

前端将在 `http://localhost:5173` 运行

### 后端开发

```bash
# 进入后端目录
cd backend

# 安装依赖（首次运行）
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库等信息

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行生产版本
npm start
```

后端将在 `http://localhost:3000` 运行

### 健康检查

启动后端后，访问：
```
GET http://localhost:3000/api/health
```

应该返回：
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-02-06T..."
}
```

---

## 📁 项目结构

### 前端结构
```
frontend/
├── src/
│   ├── components/    # 组件
│   ├── pages/         # 页面
│   ├── hooks/         # 自定义Hooks
│   ├── api/           # API调用
│   ├── utils/         # 工具函数
│   ├── types/         # TypeScript类型
│   ├── store/         # 状态管理
│   └── App.tsx        # 应用入口
├── public/            # 静态资源
└── package.json
```

### 后端结构
```
backend/
├── src/
│   ├── routes/        # 路由
│   ├── controllers/   # 控制器
│   ├── middleware/    # 中间件
│   ├── utils/         # 工具函数
│   ├── types/         # TypeScript类型
│   ├── models/        # 数据模型
│   └── app.ts         # 应用入口
├── prisma/            # Prisma配置（待添加）
└── package.json
```

---

## 📚 文档

所有项目文档位于 `docs/` 目录：

- **MVP功能清单.md** - MVP功能列表和优先级
- **功能流程图设计.md** - 系统架构和功能流程图
- **开发计划文档.md** - 4个月详细开发计划
- **部署配置方案.md** - 完全国内部署配置方案
- **下一步详细计划.md** - 当前阶段详细任务清单

---

## 🛠️ 技术栈

### 前端
- **框架：** React 19 + TypeScript 5
- **构建工具：** Vite 7
- **样式：** Tailwind CSS 4
- **路由：** React Router v6
- **状态管理：** Zustand
- **数据获取：** TanStack Query (React Query)
- **HTTP客户端：** Axios
- **表单：** React Hook Form + Zod
- **图标：** Lucide React

### 后端
- **框架：** Node.js 20 + Express 5 + TypeScript 5
- **数据库：** PostgreSQL 15
- **ORM：** Prisma（待配置）
- **认证：** JWT
- **密码加密：** bcrypt
- **文件上传：** Multer
- **验证：** express-validator

---

## 📋 MVP功能清单

### P0（核心功能）
- ✅ 用户系统（注册/登录、个人资料）
- ✅ 发帖讨论（发帖、浏览、编辑、删除）
- ✅ 分类管理（话题分类）
- ✅ 评论回复（评论、回复）
- ✅ 基础搜索
- ✅ 互动功能（点赞、收藏、评论、分享）

### P1（重要功能）
- ✅ 学习资源分享
- ✅ 用户关注
- ✅ 私信系统

### P2（后续功能）
- 活动组织
- 课程评价
- 失物招领
- 兼职信息
- 生活服务
- 匿名表白

---

## 🔧 开发环境配置

### 1. 克隆项目
```bash
git clone https://github.com/your-username/forum.git
cd forum
```

### 2. 安装依赖
```bash
# 前端
cd frontend
npm install

# 后端
cd ../backend
npm install
```

### 3. 配置环境变量

**前端 (.env.local)：**
```env
VITE_API_URL=http://localhost:3000
```

**后端 (.env)：**
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://forum_user:password@localhost:5432/forum
JWT_SECRET=your_secret_key
CORS_ORIGIN=http://localhost:5173
```

### 4. 启动开发服务器
```bash
# 终端1：启动后端
cd backend
npm run dev

# 终端2：启动前端
cd frontend
npm run dev
```

---

## 📅 开发计划

### 第1个月：技术准备 + 后端开发
- Week 1-2：市场调研 ✅
- Week 3-4：环境搭建、数据库设计、API设计 ✅
- Week 5-6：后端开发 - 用户系统
- Week 7-8：后端开发 - 内容系统

### 第2个月：后端开发 + 前端开发
- Week 9-10：后端开发 - 互动功能
- Week 11-12：前端开发 - 基础页面

### 第3个月：前后端联调 + 功能完善
- Week 13-14：前后端联调
- Week 15-16：功能完善和优化

### 第4个月：测试 + 部署
- Week 17-18：测试和Bug修复
- Week 19-20：部署上线

---

## ✅ 当前进度

### 已完成 ✅
- [x] 市场调研（问卷、访谈、竞品分析）
- [x] 调研结果分析
- [x] MVP功能清单确定
- [x] 功能流程图设计
- [x] 技术栈确定
- [x] 部署方案确定
- [x] 开发环境搭建
- [x] 项目结构初始化
- [x] 前端项目初始化
- [x] 后端项目初始化

### 进行中 🚧
- [ ] 数据库设计
- [ ] API设计
- [ ] UI设计

### 待开始 📋
- [ ] 后端开发
- [ ] 前端开发
- [ ] 测试
- [ ] 部署

---

## 📝 开发规范

### Git提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

### 代码规范
- 使用TypeScript严格模式
- 遵循ESLint规则
- 组件和函数使用有意义的命名
- 添加必要的注释

---

## 🔗 相关链接

- [开发计划文档](./docs/开发计划文档.md)
- [MVP功能清单](./docs/MVP功能清单.md)
- [功能流程图设计](./docs/功能流程图设计.md)
- [部署配置方案](./docs/部署配置方案.md)

---

## 📞 支持

如有问题，请：
1. 查阅相关文档
2. 检查环境配置
3. 查看错误日志

---

**祝开发顺利！** 🎉
