-- Multi-caisse (multi-poste) pour le métier Supermarché.
-- Chaque poste de caisse dispose de sa propre session. Le comportement
-- historique (une session par dépôt) est préservé : posteId = 'CAISSE_1'.

-- 1) Poste de caisse sur SessionCaisse
ALTER TABLE "SessionCaisse" ADD COLUMN "posteId" TEXT;
UPDATE "SessionCaisse" SET "posteId" = 'CAISSE_1' WHERE "posteId" IS NULL;
ALTER TABLE "SessionCaisse" ALTER COLUMN "posteId" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "SessionCaisse_posteId_idx" ON "SessionCaisse"("posteId");

-- 2) Remplacer « une session ouverte par dépôt » par
--    « une session ouverte par (dépôt, poste) ».
DROP INDEX IF EXISTS "SessionCaisse_one_open_per_depot_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "SessionCaisse_one_open_per_poste_idx"
  ON "SessionCaisse" ("depotId", "posteId")
  WHERE "estOuverte" = true;

-- 3) Rattacher chaque vente à la session (poste) qui l'a encaissée.
ALTER TABLE "Vente" ADD COLUMN "sessionId" TEXT;
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_sessionId_fkey" FOREIGN KEY ("sessionId")
  REFERENCES "SessionCaisse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Vente_sessionId_idx" ON "Vente"("sessionId");