-- CreateTable: 联系我们 / 用户反馈表
CREATE TABLE IF NOT EXISTS "contact_messages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "contact_messages_user_id_idx"
  ON "contact_messages"("user_id");

CREATE INDEX IF NOT EXISTS "contact_messages_status_created_at_idx"
  ON "contact_messages"("status", "created_at" DESC);

ALTER TABLE "contact_messages"
  ADD CONSTRAINT "contact_messages_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

