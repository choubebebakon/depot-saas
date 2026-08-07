-- Billing Engine: champs Tenant, idempotence webhook, enums PAST_DUE / EXPIRY_J5

ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "notchpayCustomerId" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "lastAlertSentAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "BillingWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'NOTCHPAY',
    "eventKey" TEXT NOT NULL,
    "reference" TEXT,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "payload" JSONB,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BillingWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BillingWebhookEvent_provider_eventKey_key"
    ON "BillingWebhookEvent"("provider", "eventKey");
CREATE INDEX IF NOT EXISTS "BillingWebhookEvent_reference_idx"
    ON "BillingWebhookEvent"("reference");

-- Enums PostgreSQL (ajout valeurs si absents)
DO $$ BEGIN
    ALTER TYPE "TenantStatus" ADD VALUE IF NOT EXISTS 'PAST_DUE';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "StatutAbonnement" ADD VALUE IF NOT EXISTS 'PAST_DUE';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "NotifType" ADD VALUE IF NOT EXISTS 'EXPIRY_J5';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
