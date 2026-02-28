-- AlterTable: User 增加学生证审核字段
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "student_id_image_url" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verified_by" TEXT;

CREATE INDEX IF NOT EXISTS "users_verification_status_idx" ON "users"("verification_status");

-- CreateTable: 举报表
CREATE TABLE IF NOT EXISTS "reports" (
    "id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processed_by" TEXT,
    "processed_at" TIMESTAMP(3),
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "reports_target_type_target_id_idx" ON "reports"("target_type", "target_id");
CREATE INDEX IF NOT EXISTS "reports_reporter_id_idx" ON "reports"("reporter_id");
CREATE INDEX IF NOT EXISTS "reports_status_idx" ON "reports"("status");
CREATE INDEX IF NOT EXISTS "reports_created_at_idx" ON "reports"("created_at" DESC);

ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 已有用户（含管理员）设为已通过审核，避免无法登录
UPDATE "users" SET "verification_status" = 'approved' WHERE "verification_status" = 'pending' OR "verification_status" IS NULL;
