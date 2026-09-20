-- Affectation multi-établissements (§13 matrice d'accès GesTock) :
-- un utilisateur peut être affecté à plusieurs dépôts du tenant
-- (comptable central, gérant multi-sites). User.depotId reste le dépôt
-- par défaut ; cette table élargit le périmètre d'accès.

CREATE TABLE "UserDepot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "depotId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDepot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserDepot_userId_depotId_key" ON "UserDepot"("userId", "depotId");
CREATE INDEX "UserDepot_depotId_idx" ON "UserDepot"("depotId");
CREATE INDEX "UserDepot_tenantId_idx" ON "UserDepot"("tenantId");

ALTER TABLE "UserDepot" ADD CONSTRAINT "UserDepot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserDepot" ADD CONSTRAINT "UserDepot_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserDepot" ADD CONSTRAINT "UserDepot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
