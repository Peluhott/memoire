DO $$
BEGIN
    ALTER TYPE "public"."DeliveryStatus" RENAME TO "DeliveryStatus_old";
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "public"."DeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "public"."Delivery"
DROP CONSTRAINT IF EXISTS "Delivery_contentId_fkey",
DROP CONSTRAINT IF EXISTS "Delivery_receiverId_fkey",
DROP CONSTRAINT IF EXISTS "Delivery_senderId_fkey";

DROP INDEX IF EXISTS "public"."idx_delivery_receiver_datesent";
DROP INDEX IF EXISTS "public"."idx_delivery_content_receiver";
DROP INDEX IF EXISTS "public"."idx_delivery_sender";
DROP INDEX IF EXISTS "public"."idx_delivery_expiresat";

ALTER TABLE "public"."Delivery"
RENAME COLUMN "receiverId" TO "userId";

ALTER TABLE "public"."Delivery"
ADD COLUMN IF NOT EXISTS "scheduledFor" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "sharedContentId" INTEGER,
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "public"."Delivery"
SET "scheduledFor" = COALESCE("scheduledFor", "dateSent", CURRENT_TIMESTAMP);

ALTER TABLE "public"."Delivery"
ALTER COLUMN "scheduledFor" SET NOT NULL,
ALTER COLUMN "contentId" DROP NOT NULL;

ALTER TABLE "public"."Delivery"
DROP COLUMN IF EXISTS "senderId",
DROP COLUMN IF EXISTS "timesSeen",
DROP COLUMN IF EXISTS "dateSent",
DROP COLUMN IF EXISTS "dateSeen",
DROP COLUMN IF EXISTS "expiresAt";

ALTER TABLE "public"."Delivery"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "public"."Delivery"
ALTER COLUMN "status" TYPE "public"."DeliveryStatus"
USING (
    CASE
        WHEN "status"::text IN ('DELIVERED', 'OPENED') THEN 'SENT'::"public"."DeliveryStatus"
        WHEN "status"::text = 'EXPIRED' THEN 'FAILED'::"public"."DeliveryStatus"
        ELSE 'FAILED'::"public"."DeliveryStatus"
    END
);

ALTER TABLE "public"."Delivery"
ALTER COLUMN "status" SET DEFAULT 'PENDING';

DROP TYPE IF EXISTS "public"."DeliveryStatus_old";

ALTER TABLE "public"."Delivery"
ADD CONSTRAINT "Delivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "Delivery_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."content"("id") ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT "Delivery_sharedContentId_fkey" FOREIGN KEY ("sharedContentId") REFERENCES "public"."content"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "idx_delivery_user_scheduledfor" ON "public"."Delivery"("userId", "scheduledFor");
CREATE INDEX IF NOT EXISTS "idx_delivery_status_scheduledfor" ON "public"."Delivery"("status", "scheduledFor");
