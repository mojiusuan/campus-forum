-- AlterTable: Resource 增加点赞数字段
ALTER TABLE "resources"
ADD COLUMN IF NOT EXISTS "like_count" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "resources_like_count_idx" ON "resources"("like_count" DESC);
