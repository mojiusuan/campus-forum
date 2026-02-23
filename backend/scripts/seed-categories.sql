-- 鎻掑叆鍒濆鍒嗙被鏁版嵁
-- 浣跨敤鏂规硶锛歱sql -U forum_user -d forum -h localhost -f seed-categories.sql

-- 鎻掑叆鍒嗙被锛堝鏋滀笉瀛樺湪锛?INSERT INTO categories (id, name, slug, description, icon, color, sort_order, is_active, post_count, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  '瀛︿範',
  'study',
  '瀛︿範鐩稿叧璇濋锛屽寘鎷绋嬭璁恒€佸涔犺祫鏂欏垎浜€佽€冭瘯缁忛獙绛?,
  '馃摎',
  '#3b82f6',
  1,
  true,
  0,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'study');

INSERT INTO categories (id, name, slug, description, icon, color, sort_order, is_active, post_count, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  '鐢熸椿',
  'life',
  '鐢熸椿鐩稿叧璇濋锛屽寘鎷牎鍥敓娲汇€佹棩甯稿垎浜€佺敓娲绘妧宸х瓑',
  '馃彔',
  '#10b981',
  2,
  true,
  0,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'life');

INSERT INTO categories (id, name, slug, description, icon, color, sort_order, is_active, post_count, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  '濞变箰',
  'entertainment',
  '濞变箰鐩稿叧璇濋锛屽寘鎷父鎴忋€佺數褰便€侀煶涔愩€佷綋鑲茬瓑',
  '馃幃',
  '#f59e0b',
  3,
  true,
  0,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'entertainment');

INSERT INTO categories (id, name, slug, description, icon, color, sort_order, is_active, post_count, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  '浜ゆ槗',
  'trade',
  '浜ゆ槗淇℃伅鍙戝竷锛屽寘鎷嚭鍞€佹眰璐€佷氦鎹㈢瓑',
  '馃挵',
  '#ef4444',
  4,
  true,
  0,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'trade');

INSERT INTO categories (id, name, slug, description, icon, color, sort_order, is_active, post_count, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  '娲诲姩',
  'activity',
  '娲诲姩缁勭粐锛屽寘鎷ぞ鍥㈡椿鍔ㄣ€佽仛浼氥€佹瘮璧涚瓑',
  '馃帀',
  '#8b5cf6',
  5,
  true,
  0,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'activity');

INSERT INTO categories (id, name, slug, description, icon, color, sort_order, is_active, post_count, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  '鍏朵粬',
  'other',
  '鍏朵粬璇濋',
  '馃搶',
  '#6b7280',
  6,
  true,
  0,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'other');

-- 鏄剧ず鎻掑叆缁撴灉
SELECT name, slug FROM categories ORDER BY sort_order;