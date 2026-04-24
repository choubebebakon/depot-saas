ALTER TABLE "User" ADD COLUMN "depotId" TEXT;
ALTER TABLE "Client" ADD COLUMN "depotId" TEXT;
ALTER TABLE "DetteClient" ADD COLUMN "depotId" TEXT;
ALTER TABLE "PortefeuilleConsigne" ADD COLUMN "depotId" TEXT;
ALTER TABLE "MouvementConsigne" ADD COLUMN "depotId" TEXT;
ALTER TABLE "Fournisseur" ADD COLUMN "depotId" TEXT;
ALTER TABLE "Tricycle" ADD COLUMN "depotId" TEXT;
ALTER TABLE "JournalAudit" ADD COLUMN "depotId" TEXT;
ALTER TABLE "MaintenanceTricycle" ADD COLUMN "depotId" TEXT;
ALTER TABLE "ConsommationCarburant" ADD COLUMN "depotId" TEXT;
ALTER TABLE "Commission" ADD COLUMN "depotId" TEXT;

-- Backfill de base pour les tenants mono-depot.
UPDATE "User" u
SET "depotId" = d.id
FROM "Depot" d
WHERE u."tenantId" = d."tenantId"
  AND u."depotId" IS NULL
  AND 1 = (SELECT COUNT(*) FROM "Depot" d2 WHERE d2."tenantId" = u."tenantId");

UPDATE "Client" c
SET "depotId" = d.id
FROM "Depot" d
WHERE c."tenantId" = d."tenantId"
  AND c."depotId" IS NULL
  AND 1 = (SELECT COUNT(*) FROM "Depot" d2 WHERE d2."tenantId" = c."tenantId");

UPDATE "Fournisseur" f
SET "depotId" = d.id
FROM "Depot" d
WHERE f."tenantId" = d."tenantId"
  AND f."depotId" IS NULL
  AND 1 = (SELECT COUNT(*) FROM "Depot" d2 WHERE d2."tenantId" = f."tenantId");

UPDATE "Tricycle" t
SET "depotId" = d.id
FROM "Depot" d
WHERE t."tenantId" = d."tenantId"
  AND t."depotId" IS NULL
  AND 1 = (SELECT COUNT(*) FROM "Depot" d2 WHERE d2."tenantId" = t."tenantId");

UPDATE "DetteClient" dc
SET "depotId" = c."depotId"
FROM "Client" c
WHERE dc."clientId" = c.id
  AND dc."depotId" IS NULL;

UPDATE "PortefeuilleConsigne" pc
SET "depotId" = c."depotId"
FROM "Client" c
WHERE pc."clientId" = c.id
  AND pc."depotId" IS NULL;

UPDATE "MouvementConsigne" mc
SET "depotId" = v."depotId"
FROM "Vente" v
WHERE mc."venteId" = v.id
  AND mc."depotId" IS NULL;

UPDATE "MaintenanceTricycle" mt
SET "depotId" = t."depotId"
FROM "Tricycle" t
WHERE mt."tricycleId" = t.id
  AND mt."depotId" IS NULL;

UPDATE "ConsommationCarburant" cc
SET "depotId" = t."depotId"
FROM "Tricycle" t
WHERE cc."tricycleId" = t.id
  AND cc."depotId" IS NULL;

UPDATE "Commission" c
SET "depotId" = u."depotId"
FROM "User" u
WHERE c."userId" = u.id
  AND c."depotId" IS NULL;

CREATE INDEX "User_depotId_idx" ON "User"("depotId");
CREATE INDEX "Client_depotId_idx" ON "Client"("depotId");
CREATE INDEX "DetteClient_depotId_idx" ON "DetteClient"("depotId");
CREATE INDEX "PortefeuilleConsigne_depotId_idx" ON "PortefeuilleConsigne"("depotId");
CREATE INDEX "MouvementConsigne_depotId_idx" ON "MouvementConsigne"("depotId");
CREATE INDEX "Fournisseur_depotId_idx" ON "Fournisseur"("depotId");
CREATE INDEX "Tricycle_depotId_idx" ON "Tricycle"("depotId");
CREATE INDEX "JournalAudit_depotId_idx" ON "JournalAudit"("depotId");
CREATE INDEX "MaintenanceTricycle_depotId_idx" ON "MaintenanceTricycle"("depotId");
CREATE INDEX "ConsommationCarburant_depotId_idx" ON "ConsommationCarburant"("depotId");
CREATE INDEX "Commission_depotId_idx" ON "Commission"("depotId");

ALTER TABLE "User" ADD CONSTRAINT "User_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Client" ADD CONSTRAINT "Client_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DetteClient" ADD CONSTRAINT "DetteClient_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PortefeuilleConsigne" ADD CONSTRAINT "PortefeuilleConsigne_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MouvementConsigne" ADD CONSTRAINT "MouvementConsigne_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Fournisseur" ADD CONSTRAINT "Fournisseur_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Tricycle" ADD CONSTRAINT "Tricycle_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "JournalAudit" ADD CONSTRAINT "JournalAudit_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaintenanceTricycle" ADD CONSTRAINT "MaintenanceTricycle_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConsommationCarburant" ADD CONSTRAINT "ConsommationCarburant_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
