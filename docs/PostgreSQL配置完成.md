# PostgreSQL配置完成检查

## ✅ 安装状态

### 安装信息
- **安装路径：** D:\postgreSQL
- **版本：** PostgreSQL 18.1
- **psql路径：** D:\postgreSQL\bin\psql.exe
- **端口：** 5432（已监听）

### 检查结果
- ✅ PostgreSQL已安装
- ✅ psql命令可用（需要完整路径）
- ✅ 端口5432正在监听
- ⚠️ 环境变量未配置（可选）

---

## 🔧 配置环境变量（推荐）

为了更方便地使用psql命令，建议将PostgreSQL的bin目录添加到系统PATH：

### 方法1：临时添加（当前会话）

```powershell
$env:Path += ";D:\postgreSQL\bin"
```

### 方法2：永久添加（推荐）

1. 右键"此电脑" → "属性"
2. 点击"高级系统设置"
3. 点击"环境变量"
4. 在"系统变量"中找到`Path`，点击"编辑"
5. 点击"新建"，添加：`D:\postgreSQL\bin`
6. 点击"确定"保存
7. **重启PowerShell或命令提示符**

验证：
```bash
psql --version
```

---

## 📋 下一步操作

### 步骤1：创建数据库和用户

```bash
# 使用完整路径连接PostgreSQL
& "D:\postgreSQL\bin\psql.exe" -U postgres
```

**输入postgres用户密码后，执行：**
```sql
-- 创建数据库
CREATE DATABASE forum;

-- 创建用户
CREATE USER forum_user WITH PASSWORD 'your_password_here';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE forum TO forum_user;

-- 允许用户创建数据库（用于迁移）
ALTER USER forum_user CREATEDB;

-- 退出
\q
```

### 步骤2：配置项目环境变量

编辑 `backend/.env` 文件：
```env
DATABASE_URL="postgresql://forum_user:your_password_here@localhost:5432/forum?schema=public"
JWT_SECRET="your_very_long_and_secure_jwt_secret_key_here_min_32_chars"
```

### 步骤3：运行数据库迁移

```bash
cd backend
npm run prisma:generate
npx prisma migrate dev --name init
npm run prisma:seed
```

---

## 🧪 测试连接

### 测试postgres用户连接
```bash
& "D:\postgreSQL\bin\psql.exe" -U postgres
```

### 测试新用户连接（创建用户后）
```bash
& "D:\postgreSQL\bin\psql.exe" -U forum_user -d forum -h localhost
```

---

## 📝 快速命令参考

由于环境变量可能未配置，可以使用以下方式：

### 连接PostgreSQL
```powershell
# 使用postgres用户
& "D:\postgreSQL\bin\psql.exe" -U postgres

# 使用forum_user用户
& "D:\postgreSQL\bin\psql.exe" -U forum_user -d forum
```

### 查看数据库列表
```sql
\l
```

### 查看用户列表
```sql
\du
```

### 切换数据库
```sql
\c forum
```

### 退出
```sql
\q
```

---

**文档版本：** v1.0  
**创建日期：** 2026-02-06
