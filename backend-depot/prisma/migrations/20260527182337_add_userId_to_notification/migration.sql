-- Create missing enum types
DO $$ BEGIN
  CREATE TYPE "NotifCategory" AS ENUM ('STOCK', 'PAYMENT', 'SUBSCRIPTION', 'RESERVATION', 'ORDER', 'DELIVERY', 'SECURITY', 'APPOINTMENT', 'MAINTENANCE', 'SYSTEM', 'METIER', 'IA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotifPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotifChannel" AS ENUM ('IN_APP', 'EMAIL', 'WHATSAPP', 'PUSH', 'SMS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add missing columns to Notification table
DO $$ BEGIN
  ALTER TABLE "Notification" ADD COLUMN "userId" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Notification" ADD COLUMN "category" "NotifCategory" NOT NULL DEFAULT 'SYSTEM';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Notification" ADD COLUMN "priority" "NotifPriority" NOT NULL DEFAULT 'MEDIUM';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Notification" ADD COLUMN "channel" "NotifChannel" NOT NULL DEFAULT 'IN_APP';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Notification" ADD COLUMN "actionUrl" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Notification" ADD COLUMN "actionLabel" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Notification" ADD COLUMN "metadata" JSONB;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Notification" ADD COLUMN "expiresAt" TIMESTAMP(3);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Notification" ADD COLUMN "deliveryStatus" "DeliveryStatus" NOT NULL DEFAULT 'PENDING';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Notification" ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Notification" ADD COLUMN "groupKey" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Notification" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add foreign key for userId (if not already added)
DO $$ BEGIN
  ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add missing indexes (IF NOT EXISTS not supported for indexes in PG < 9.5, using DO block)
CREATE INDEX IF NOT EXISTS "Notification_tenantId_userId_priority_idx" ON "Notification"("tenantId", "userId", "priority");
