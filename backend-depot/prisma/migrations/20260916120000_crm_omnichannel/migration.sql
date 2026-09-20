-- CRM omnicanal : identités multicanal des clients finaux (WhatsApp Business,
-- Instagram DM, Facebook Messenger), métadonnées fusionnées et clés d'API
-- machine-à-machine utilisées par l'orchestrateur IA / les webhooks Meta.
--
-- Idempotente : peut être rejouée sans erreur sur une base déjà migrée.

-- 1. Canaux supportés ---------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "CrmChannel" AS ENUM ('WHATSAPP', 'INSTAGRAM', 'MESSENGER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Identités multicanal sur Client (Shop = Tenant) ---------------------------
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "instagramId" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "messengerId" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "metaData" JSONB NOT NULL DEFAULT '{}';
-- updatedAt est un champ @updatedAt (géré par Prisma) : il ne doit PAS rester
-- de valeur DEFAULT en base, sinon le schéma et la base divergent. On backfill
-- les lignes existantes via un défaut temporaire, puis on le retire.
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Client" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- 3. Hygiène des données AVANT création des index uniques ---------------------
-- Une chaîne vide n'est pas un identifiant : on la ramène à NULL. PostgreSQL
-- considère chaque NULL comme distinct dans un index unique, donc plusieurs
-- clients sans téléphone peuvent coexister sans faux conflit d'unicité.
UPDATE "Client" SET "telephone" = NULL WHERE "telephone" = '';
UPDATE "Client" SET "telephone" = NULL WHERE btrim("telephone") = '';

-- 3bis. Garde-fou explicite : si de vrais doublons (même tenant, même
-- téléphone) existent déjà, l'index unique échouerait avec un message cryptique.
-- On échoue ici avec un message actionnable, sans avoir modifié la base.
DO $$
DECLARE
  doublons INTEGER;
  exemple TEXT;
BEGIN
  SELECT COUNT(*) INTO doublons
  FROM (
    SELECT "tenantId", "telephone"
    FROM "Client"
    WHERE "telephone" IS NOT NULL
    GROUP BY "tenantId", "telephone"
    HAVING COUNT(*) > 1
  ) AS d;

  IF doublons > 0 THEN
    SELECT MIN(c."tenantId" || ' / ' || c."telephone")
    INTO exemple
    FROM (
      SELECT "tenantId", "telephone"
      FROM "Client"
      WHERE "telephone" IS NOT NULL
      GROUP BY "tenantId", "telephone"
      HAVING COUNT(*) > 1
    ) AS c;

    RAISE EXCEPTION
      'Migration CRM interrompue : % doublon(s) de telephone dans un meme tenant (exemple : %). Fusionnez ou anonymisez ces clients avant de relancer la migration.',
      doublons,
      exemple;
  END IF;
END $$;

-- 4. Unicité et index par tenant ----------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS "Client_tenantId_telephone_key" ON "Client"("tenantId", "telephone");
CREATE UNIQUE INDEX IF NOT EXISTS "Client_tenantId_instagramId_key" ON "Client"("tenantId", "instagramId");
CREATE UNIQUE INDEX IF NOT EXISTS "Client_tenantId_messengerId_key" ON "Client"("tenantId", "messengerId");
CREATE INDEX IF NOT EXISTS "Client_telephone_idx" ON "Client"("telephone");
CREATE INDEX IF NOT EXISTS "Client_instagramId_idx" ON "Client"("instagramId");
CREATE INDEX IF NOT EXISTS "Client_messengerId_idx" ON "Client"("messengerId");

-- 5. Index de pagination keyset de l'historique d'achats -----------------------
-- La requête CRM filtre sur clientId et trie sur (date DESC, id DESC) : cet
-- index composite évite un tri en mémoire à chaque page.
CREATE INDEX IF NOT EXISTS "Vente_clientId_date_id_idx" ON "Vente"("clientId", "date" DESC, "id" DESC);

-- 6. Clés d'API machine-à-machine (empreinte HMAC-SHA256 uniquement) -----------
CREATE TABLE IF NOT EXISTS "CrmApiKey" (
  "id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "keyPrefix" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "allowedChannels" "CrmChannel"[] DEFAULT ARRAY[]::"CrmChannel"[],
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "lastUsedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "tenantId" TEXT NOT NULL,
  CONSTRAINT "CrmApiKey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CrmApiKey_keyHash_key" ON "CrmApiKey"("keyHash");
CREATE INDEX IF NOT EXISTS "CrmApiKey_tenantId_idx" ON "CrmApiKey"("tenantId");
CREATE INDEX IF NOT EXISTS "CrmApiKey_isActive_idx" ON "CrmApiKey"("isActive");
CREATE INDEX IF NOT EXISTS "CrmApiKey_expiresAt_idx" ON "CrmApiKey"("expiresAt");

-- onDelete: Cascade — supprimer le tenant révoque ses clés d'API.
DO $$ BEGIN
  ALTER TABLE "CrmApiKey" ADD CONSTRAINT "CrmApiKey_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;