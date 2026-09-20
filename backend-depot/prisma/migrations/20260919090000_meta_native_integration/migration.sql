-- Intégration Meta native (WhatsApp Cloud API / Instagram / Messenger) :
-- MetaIntegration (canaux connectés par commerçant, jeton chiffré) et
-- MetaWebhookEvent (déduplication des notifications webhook).
--
-- Idempotente : peut être rejouée sans erreur sur une base déjà migrée.

-- 1. Enum de canaux ------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "MetaChannel" AS ENUM ('WHATSAPP', 'INSTAGRAM', 'MESSENGER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. MetaIntegration -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS "MetaIntegration" (
  "id"                   TEXT NOT NULL,
  "tenantId"             TEXT NOT NULL,
  "channel"              "MetaChannel" NOT NULL,
  "wabaId"               TEXT,
  "phoneNumberId"        TEXT,
  "displayPhoneNumber"   TEXT,
  "instagramPageId"      TEXT,
  "facebookPageId"       TEXT,
  "encryptedAccessToken" TEXT NOT NULL,
  "tokenExpiresAt"       TIMESTAMP(3),
  "isActive"             BOOLEAN NOT NULL DEFAULT true,
  "lastCheckedAt"        TIMESTAMP(3),
  "lastCheckStatus"      TEXT,
  "lastError"            TEXT,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MetaIntegration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MetaIntegration_phoneNumberId_key" ON "MetaIntegration"("phoneNumberId");
CREATE UNIQUE INDEX IF NOT EXISTS "MetaIntegration_instagramPageId_key" ON "MetaIntegration"("instagramPageId");
CREATE UNIQUE INDEX IF NOT EXISTS "MetaIntegration_facebookPageId_key" ON "MetaIntegration"("facebookPageId");
CREATE INDEX IF NOT EXISTS "MetaIntegration_tenantId_idx" ON "MetaIntegration"("tenantId");
CREATE INDEX IF NOT EXISTS "MetaIntegration_isActive_idx" ON "MetaIntegration"("isActive");
CREATE INDEX IF NOT EXISTS "MetaIntegration_tokenExpiresAt_idx" ON "MetaIntegration"("tokenExpiresAt");

DO $$ BEGIN
  ALTER TABLE "MetaIntegration"
    ADD CONSTRAINT "MetaIntegration_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. MetaWebhookEvent ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS "MetaWebhookEvent" (
  "id"         TEXT NOT NULL,
  "eventId"    TEXT NOT NULL,
  "sourceId"   TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MetaWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MetaWebhookEvent_eventId_key" ON "MetaWebhookEvent"("eventId");
CREATE INDEX IF NOT EXISTS "MetaWebhookEvent_receivedAt_idx" ON "MetaWebhookEvent"("receivedAt");