-- CreateEnum
CREATE TYPE "MetierType" AS ENUM ('DEPOT_BOISSONS', 'BOUTIQUE', 'QUINCAILLERIE', 'PHARMACIE', 'RESTAURANT', 'TELEPHONIE', 'SUPERMARCHE', 'CIMENT_BTP', 'PRESSING', 'GARAGE_AUTOMOBILE', 'ELEVAGE', 'SALON_COIFFURE_BEAUTE', 'PARFUMERIE_COSMETIQUE', 'BOULANGERIE_PATISSERIE', 'GLACIER_SNACK', 'LIBRAIRIE_PAPETERIE', 'CLINIQUE', 'TRANSPORT_LOGISTIQUE', 'GESTION_IMMOBILIERE', 'HOTEL');

-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('POURCENTAGE', 'MONTANT_FIXE', 'PRIX_FIXE');

-- CreateEnum
CREATE TYPE "CreditType" AS ENUM ('AJOUT', 'DEDUCTION');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "metier" "MetierType" NOT NULL DEFAULT 'DEPOT_BOISSONS';

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "PromotionType" NOT NULL DEFAULT 'POURCENTAGE',
    "valeur" DOUBLE PRECISION NOT NULL,
    "prixPromo" DOUBLE PRECISION NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditClient" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "solde" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "plafond" DOUBLE PRECISION NOT NULL DEFAULT 50000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoriqueCredit" (
    "id" TEXT NOT NULL,
    "creditClientId" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "type" "CreditType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoriqueCredit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Promotion_tenantId_idx" ON "Promotion"("tenantId");

-- CreateIndex
CREATE INDEX "Promotion_articleId_idx" ON "Promotion"("articleId");

-- CreateIndex
CREATE INDEX "Promotion_actif_dateFin_idx" ON "Promotion"("actif", "dateFin");

-- CreateIndex
CREATE UNIQUE INDEX "CreditClient_clientId_key" ON "CreditClient"("clientId");

-- CreateIndex
CREATE INDEX "CreditClient_tenantId_idx" ON "CreditClient"("tenantId");

-- CreateIndex
CREATE INDEX "HistoriqueCredit_creditClientId_idx" ON "HistoriqueCredit"("creditClientId");

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditClient" ADD CONSTRAINT "CreditClient_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditClient" ADD CONSTRAINT "CreditClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriqueCredit" ADD CONSTRAINT "HistoriqueCredit_creditClientId_fkey" FOREIGN KEY ("creditClientId") REFERENCES "CreditClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
