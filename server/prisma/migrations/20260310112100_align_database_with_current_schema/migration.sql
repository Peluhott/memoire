ALTER TABLE "public"."user"
ADD COLUMN IF NOT EXISTS "limit_upload" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN IF NOT EXISTS "limit_connections" INTEGER NOT NULL DEFAULT 25,
ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
    CREATE TYPE "public"."HealthType" AS ENUM ('hrvBaseline', 'rhrBaseline', 'sleepBaseline', 'stepsBaseline');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "public"."ConnectionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'BLOCKED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "public"."DeliveryStatus" AS ENUM ('DELIVERED', 'OPENED', 'EXPIRED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "public"."content" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "public_id" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shared_with_network" BOOLEAN NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."HealthData" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "public"."HealthType" NOT NULL,
    "value" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3),

    CONSTRAINT "HealthData_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."Connection" (
    "id" SERIAL NOT NULL,
    "userAId" INTEGER NOT NULL,
    "userBId" INTEGER NOT NULL,
    "requester" INTEGER NOT NULL,
    "status" "public"."ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."Delivery" (
    "id" SERIAL NOT NULL,
    "contentId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "timesSeen" INTEGER NOT NULL DEFAULT 0,
    "dateSent" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateSeen" TIMESTAMP(3),
    "status" "public"."DeliveryStatus" NOT NULL DEFAULT 'DELIVERED',
    "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT (now() + interval '24 hours'),

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "HealthData_userId_type_key" ON "public"."HealthData"("userId", "type");

CREATE UNIQUE INDEX IF NOT EXISTS "Connection_userAId_userBId_key" ON "public"."Connection"("userAId", "userBId");

CREATE INDEX IF NOT EXISTS "idx_delivery_receiver_datesent" ON "public"."Delivery"("receiverId", "dateSent");

CREATE INDEX IF NOT EXISTS "idx_delivery_content_receiver" ON "public"."Delivery"("contentId", "receiverId");

CREATE INDEX IF NOT EXISTS "idx_delivery_sender" ON "public"."Delivery"("senderId");

CREATE INDEX IF NOT EXISTS "idx_delivery_expiresat" ON "public"."Delivery"("expiresAt");

DO $$
BEGIN
    ALTER TABLE "public"."content"
    ADD CONSTRAINT "content_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "public"."HealthData"
    ADD CONSTRAINT "HealthData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "public"."Connection"
    ADD CONSTRAINT "Connection_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "public"."Connection"
    ADD CONSTRAINT "Connection_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "public"."Delivery"
    ADD CONSTRAINT "Delivery_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "public"."Delivery"
    ADD CONSTRAINT "Delivery_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "public"."Delivery"
    ADD CONSTRAINT "Delivery_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
