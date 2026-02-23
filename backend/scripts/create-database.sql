-- 创建数据库和用户的SQL脚本
-- 使用方法：psql -U postgres -f create-database.sql

-- 创建数据库（如果不存在）
CREATE DATABASE forum;

-- 创建用户（如果不存在�?-- 注意：请修改密码 'your_password_here' 为你想要的密�?DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'forum_user') THEN
        CREATE USER forum_user WITH PASSWORD '54TFD99M';
    END IF;
END
$$;

-- 授权
GRANT ALL PRIVILEGES ON DATABASE forum TO forum_user;

-- 允许用户创建数据库（用于迁移�?ALTER USER forum_user CREATEDB;

-- 连接到forum数据库并授权schema
\c forum

-- 授权schema权限
GRANT ALL ON SCHEMA public TO forum_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO forum_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO forum_user;

-- 显示创建结果
\echo '数据库和用户创建完成�?
\echo '数据�? forum'
\echo '用户: forum_user'
\echo '请记住修改脚本中的密码！'
