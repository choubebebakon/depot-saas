-- CreateEnum
CREATE TYPE "DevisStatut" AS ENUM ('EN_ATTENTE', 'ACCEPTE', 'REFUSE', 'CONVERTI');

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "prixGros" DOUBLE PRECISION,
ADD COLUMN     "unite" TEXT NOT NULL DEFAULT 'PIECE';

-- CreateTable
CREATE TABLE "Devis" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "chantierId" TEXT,
    "montantHT" DOUBLE PRECISION NOT NULL,
    "montantTTC" DOUBLE PRECISION NOT NULL,
    "statut" "DevisStatut" NOT NULL DEFAULT 'EN_ATTENTE',
    "dateExpiry" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Devis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneDevis" (
    "id" TEXT NOT NULL,
    "devisId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,
    "unite" TEXT NOT NULL,
    "prixUnit" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "LigneDevis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chantier" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'EN_COURS',
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chantier_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Devis" ADD CONSTRAINT "Devis_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devis" ADD CONSTRAINT "Devis_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devis" ADD CONSTRAINT "Devis_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "Chantier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneDevis" ADD CONSTRAINT "LigneDevis_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "Devis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneDevis" ADD CONSTRAINT "LigneDevis_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chantier" ADD CONSTRAINT "Chantier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chantier" ADD CONSTRAINT "Chantier_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
