-- CreateEnum
CREATE TYPE "StatutTransfert" AS ENUM ('BROUILLON', 'EN_COURS', 'TERMINE', 'ANNULE');

-- CreateEnum
CREATE TYPE "StatutCommande" AS ENUM ('BROUILLON', 'ENVOYE', 'RECU', 'ANNULE');

-- Rename Table Site to Depot
ALTER TABLE "Site" RENAME TO "Depot";

-- Rename siteId columns to depotId
ALTER TABLE "Stock" RENAME COLUMN "siteId" TO "depotId";
ALTER TABLE "LotStock" RENAME COLUMN "siteId" TO "depotId";
ALTER TABLE "MouvementStock" RENAME COLUMN "siteId" TO "depotId";
ALTER TABLE "Vente" RENAME COLUMN "siteId" TO "depotId";
ALTER TABLE "ReceptionFournisseur" RENAME COLUMN "siteId" TO "depotId";
ALTER TABLE "Tournee" RENAME COLUMN "siteId" TO "depotId";
ALTER TABLE "SessionCaisse" RENAME COLUMN "siteId" TO "depotId";
ALTER TABLE "Depense" RENAME COLUMN "siteId" TO "depotId";

-- Update constraints for Depot
-- (PostgreSQL automatically renames the primary key constraint if we rename the table)
-- (But we might want to be explicit about index names if Prisma cares)
ALTER INDEX "Site_pkey" RENAME TO "Depot_pkey";

-- Add new columns
ALTER TABLE "Stock" ADD COLUMN     "seuilCritique" INTEGER;

-- CreateTable
CREATE TABLE "TransfertStock" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "statut" "StatutTransfert" NOT NULL DEFAULT 'BROUILLON',
    "motif" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sourceDepotId" TEXT NOT NULL,
    "destDepotId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "TransfertStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneTransfert" (
    "id" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "transfertId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,

    CONSTRAINT "LigneTransfert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommandeFournisseur" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "statut" "StatutCommande" NOT NULL DEFAULT 'BROUILLON',
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dateCommande" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateReceptionPrev" TIMESTAMP(3),
    "note" TEXT,
    "fournisseurId" TEXT NOT NULL,
    "depotId" TEXT NOT NULL,
    "createurId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "CommandeFournisseur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneCommandeFournisseur" (
    "id" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixAchatUnit" DOUBLE PRECISION NOT NULL,
    "commandeId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,

    CONSTRAINT "LigneCommandeFournisseur_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransfertStock_reference_key" ON "TransfertStock"("reference");

-- CreateIndex
CREATE INDEX "TransfertStock_tenantId_idx" ON "TransfertStock"("tenantId");

-- CreateIndex
CREATE INDEX "LigneTransfert_transfertId_idx" ON "LigneTransfert"("transfertId");

-- CreateIndex
CREATE UNIQUE INDEX "CommandeFournisseur_reference_key" ON "CommandeFournisseur"("reference");

-- CreateIndex
CREATE INDEX "CommandeFournisseur_tenantId_idx" ON "CommandeFournisseur"("tenantId");

-- CreateIndex
CREATE INDEX "CommandeFournisseur_depotId_idx" ON "CommandeFournisseur"("depotId");

-- CreateIndex
CREATE INDEX "LigneCommandeFournisseur_commandeId_idx" ON "LigneCommandeFournisseur"("commandeId");

-- Rename existing indexes from Site to Depot
ALTER INDEX "Site_tenantId_idx" RENAME TO "Depot_tenantId_idx";
ALTER INDEX "Stock_articleId_siteId_key" RENAME TO "Stock_articleId_depotId_key";
ALTER INDEX "Stock_siteId_idx" RENAME TO "Stock_depotId_idx";
ALTER INDEX "LotStock_siteId_idx" RENAME TO "LotStock_depotId_idx";
ALTER INDEX "MouvementStock_siteId_idx" RENAME TO "MouvementStock_depotId_idx";
ALTER INDEX "Vente_siteId_idx" RENAME TO "Vente_depotId_idx";
ALTER INDEX "ReceptionFournisseur_siteId_idx" RENAME TO "ReceptionFournisseur_depotId_idx";

-- Add new indexes
CREATE INDEX "SessionCaisse_depotId_idx" ON "SessionCaisse"("depotId");
CREATE INDEX "Depense_depotId_idx" ON "Depense"("depotId");
CREATE INDEX "Tournee_depotId_idx" ON "Tournee"("depotId");

-- AddForeignKey
ALTER TABLE "Depot" ADD CONSTRAINT "Depot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotStock" ADD CONSTRAINT "LotStock_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransfertStock" ADD CONSTRAINT "TransfertStock_sourceDepotId_fkey" FOREIGN KEY ("sourceDepotId") REFERENCES "Depot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransfertStock" ADD CONSTRAINT "TransfertStock_destDepotId_fkey" FOREIGN KEY ("destDepotId") REFERENCES "Depot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransfertStock" ADD CONSTRAINT "TransfertStock_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneTransfert" ADD CONSTRAINT "LigneTransfert_transfertId_fkey" FOREIGN KEY ("transfertId") REFERENCES "TransfertStock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneTransfert" ADD CONSTRAINT "LigneTransfert_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandeFournisseur" ADD CONSTRAINT "CommandeFournisseur_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "Fournisseur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandeFournisseur" ADD CONSTRAINT "CommandeFournisseur_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandeFournisseur" ADD CONSTRAINT "CommandeFournisseur_createurId_fkey" FOREIGN KEY ("createurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandeFournisseur" ADD CONSTRAINT "CommandeFournisseur_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneCommandeFournisseur" ADD CONSTRAINT "LigneCommandeFournisseur_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "CommandeFournisseur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneCommandeFournisseur" ADD CONSTRAINT "LigneCommandeFournisseur_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceptionFournisseur" ADD CONSTRAINT "ReceptionFournisseur_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournee" ADD CONSTRAINT "Tournee_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionCaisse" ADD CONSTRAINT "SessionCaisse_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Depense" ADD CONSTRAINT "Depense_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
