-- ============================================================
-- MIGRATION : Refonte Système Billing/Abonnement — GesTock SaaS
-- Date       : 2026-07-14
-- Description: Consolidation vers une source de vérité unique.
--              Préserve toutes les données existantes.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- PHASE 1 : Création des nouveaux types (enum PostgreSQL)
-- ──────────────────────────────────────────────────────────────

CREATE TYPE "SubscriptionStatus" AS ENUM (
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'TRIAL_EXPIRED'
);

CREATE TYPE "AlertType" AS ENUM (
  'TRIAL_J5',
  'MONTHLY_J3',
  'ANNUAL_J14',
  'ANNUAL_J3',
  'PAST_DUE_RETRY_1',
  'PAST_DUE_RETRY_2',
  'PAST_DUE_RETRY_3'
);

-- ──────────────────────────────────────────────────────────────
-- PHASE 2 : Ajout des nouvelles colonnes sur Tenant (nullable
--           pour permettre la migration des données)
-- ──────────────────────────────────────────────────────────────

ALTER TABLE "Tenant"
  ADD COLUMN "subscriptionStatus" "SubscriptionStatus",
  ADD COLUMN "billingCycle"       "BillingCycle" DEFAULT 'MONTHLY',
  ADD COLUMN "trialEndsAt"        TIMESTAMP(3),
  ADD COLUMN "currentPeriodEnd"   TIMESTAMP(3),
  ADD COLUMN "paymentRetryCount"  INTEGER NOT NULL DEFAULT 0;

-- ──────────────────────────────────────────────────────────────
-- PHASE 3 : Migration des données existantes vers les nouveaux champs
-- ──────────────────────────────────────────────────────────────

-- 3a. Copier dateEssaiFin → trialEndsAt
UPDATE "Tenant"
SET "trialEndsAt" = "dateEssaiFin"
WHERE "dateEssaiFin" IS NOT NULL;

-- 3b. Copier subscriptionEnd ?? dateExpiration → currentPeriodEnd
UPDATE "Tenant"
SET "currentPeriodEnd" = COALESCE("subscriptionEnd", "dateExpiration")
WHERE COALESCE("subscriptionEnd", "dateExpiration") IS NOT NULL;

-- 3c. Mapper l'ancien status → subscriptionStatus
--     TenantStatus/StatutAbonnement → SubscriptionStatus
UPDATE "Tenant"
SET "subscriptionStatus" = CASE
  WHEN "status"::TEXT IN ('TRIAL')
    THEN 'TRIALING'::"SubscriptionStatus"
  WHEN "status"::TEXT IN ('ACTIVE')
    THEN 'ACTIVE'::"SubscriptionStatus"
  WHEN "status"::TEXT IN ('PAST_DUE', 'GRACE', 'GRACE_PERIOD')
    THEN 'PAST_DUE'::"SubscriptionStatus"
  WHEN "status"::TEXT IN ('EXPIRED', 'READ_ONLY')
    AND "dateEssaiFin" IS NOT NULL
    AND COALESCE("subscriptionEnd", "dateExpiration") IS NULL
    THEN 'TRIAL_EXPIRED'::"SubscriptionStatus"
  WHEN "status"::TEXT IN ('EXPIRED', 'READ_ONLY')
    THEN 'CANCELED'::"SubscriptionStatus"
  ELSE 'TRIALING'::"SubscriptionStatus"
END;

-- 3d. Pour les tenants sans status renseigné : TRIALING par défaut
UPDATE "Tenant"
SET "subscriptionStatus" = 'TRIALING'::"SubscriptionStatus"
WHERE "subscriptionStatus" IS NULL;

-- ──────────────────────────────────────────────────────────────
-- PHASE 4 : Rendre subscriptionStatus NOT NULL avec DEFAULT
-- ──────────────────────────────────────────────────────────────

ALTER TABLE "Tenant"
  ALTER COLUMN "subscriptionStatus" SET NOT NULL,
  ALTER COLUMN "subscriptionStatus" SET DEFAULT 'TRIALING';

-- ──────────────────────────────────────────────────────────────
-- PHASE 5 : Création de la table SubscriptionAlert
-- ──────────────────────────────────────────────────────────────

CREATE TABLE "SubscriptionAlert" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "tenantId"    TEXT NOT NULL,
  "alertType"   "AlertType" NOT NULL,
  "sentAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SubscriptionAlert_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SubscriptionAlert_tenantId_alertType_key"
    UNIQUE ("tenantId", "alertType"),
  CONSTRAINT "SubscriptionAlert_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

CREATE INDEX "SubscriptionAlert_tenantId_idx" ON "SubscriptionAlert"("tenantId");

-- ──────────────────────────────────────────────────────────────
-- PHASE 6 : Ajout NotifType et AuditAction (ALTER TYPE PostgreSQL)
-- ──────────────────────────────────────────────────────────────

ALTER TYPE "NotifType" ADD VALUE IF NOT EXISTS 'EXPIRY_J14';
ALTER TYPE "NotifType" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_PAST_DUE';
ALTER TYPE "NotifType" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_CANCELED';
ALTER TYPE "NotifType" ADD VALUE IF NOT EXISTS 'DUNNING_RETRY';

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_STATUS_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_TRIAL_EXPIRED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_PAYMENT_FAILED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_ACTIVATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_CANCELED';

-- ──────────────────────────────────────────────────────────────
-- PHASE 7 : Suppression des colonnes redondantes sur Tenant
--           ⚠ SEULEMENT après confirmation que la migration est OK
-- ──────────────────────────────────────────────────────────────

ALTER TABLE "Tenant"
  DROP COLUMN IF EXISTS "status",
  DROP COLUMN IF EXISTS "statutAbonnement",
  DROP COLUMN IF EXISTS "subscriptionEnd",
  DROP COLUMN IF EXISTS "dateExpiration",
  DROP COLUMN IF EXISTS "dateEssaiFin",
  DROP COLUMN IF EXISTS "graceUntil",
  DROP COLUMN IF EXISTS "lastAlertSentAt",
  DROP COLUMN IF EXISTS "planAbonnement";

-- ──────────────────────────────────────────────────────────────
-- PHASE 8 : Suppression des anciens types enum devenus obsolètes
-- ──────────────────────────────────────────────────────────────

DROP TYPE IF EXISTS "TenantStatus";
DROP TYPE IF EXISTS "StatutAbonnement";
DROP TYPE IF EXISTS "PlanAbonnement";
