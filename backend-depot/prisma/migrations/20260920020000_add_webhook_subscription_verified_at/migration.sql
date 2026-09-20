-- Contrainte n°8 & n°9 Meta Native Integration :
-- 1. webhookSubscriptionVerifiedAt sur MetaIntegration
-- 2. Valeur META_TOKEN_EXPIRING sur l'enum NotifType

-- 1. Ajout de la colonne webhookSubscriptionVerifiedAt
ALTER TABLE "MetaIntegration"
  ADD COLUMN IF NOT EXISTS "webhookSubscriptionVerifiedAt" TIMESTAMP(3);

-- 2. Ajout de la valeur d'énumération META_TOKEN_EXPIRING
DO $$ BEGIN
  ALTER TYPE "NotifType" ADD VALUE IF NOT EXISTS 'META_TOKEN_EXPIRING';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
