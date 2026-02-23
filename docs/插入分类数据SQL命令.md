# 插入分类数据SQL命令

## 使用方法

在你的终端执行：

```bash
psql -U forum_user -d forum -h localhost
```

输入密码：`54TFD99M`

然后在PostgreSQL命令行中，复制粘贴以下SQL命令：

```sql
-- 插入分类数据
INSERT INTO categories (id, name, slug, description, icon, color, sort_order, is_active, post_count, created_at, updated_at)
SELECT gen_random_uuid(), '学习', 'study', '学习相关话题，包括课程讨论、学习资料分享、考试经验等', NULL, '#3b82f6', 1, true, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'study');

INSERT INTO categories (id, name, slug, description, icon, color, sort_order, is_active, post_count, created_at, updated_at)
SELECT gen_random_uuid(), '生活', 'life', '生活相关话题，包括校园生活、日常分享、生活技巧等', NULL, '#10b981', 2, true, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'life');

INSERT INTO categories (id, name, slug, description, icon, color, sort_order, is_active, post_count, created_at, updated_at)
SELECT gen_random_uuid(), '娱乐', 'entertainment', '娱乐相关话题，包括游戏、电影、音乐、体育等', NULL, '#f59e0b', 3, true, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'entertainment');

INSERT INTO categories (id, name, slug, description, icon, color, sort_order, is_active, post_count, created_at, updated_at)
SELECT gen_random_uuid(), '交易', 'trade', '交易信息发布，包括出售、求购、交换等', NULL, '#ef4444', 4, true, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'trade');

INSERT INTO categories (id, name, slug, description, icon, color, sort_order, is_active, post_count, created_at, updated_at)
SELECT gen_random_uuid(), '活动', 'activity', '活动组织，包括社团活动、聚会、比赛等', NULL, '#8b5cf6', 5, true, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'activity');

INSERT INTO categories (id, name, slug, description, icon, color, sort_order, is_active, post_count, created_at, updated_at)
SELECT gen_random_uuid(), '其他', 'other', '其他话题', NULL, '#6b7280', 6, true, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'other');

-- 查看结果
SELECT name, slug FROM categories ORDER BY sort_order;

-- 退出
\q
```

---

## 或者使用单条命令执行

```bash
psql -U forum_user -d forum -h localhost -c "INSERT INTO categories (id, name, slug, description, icon, color, sort_order, is_active, post_count, created_at, updated_at) SELECT gen_random_uuid(), '学习', 'study', '学习相关话题', NULL, '#3b82f6', 1, true, 0, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'study');"
```

（需要为每个分类执行一次）

---

**文档版本：** v1.0  
**创建日期：** 2026-02-06
