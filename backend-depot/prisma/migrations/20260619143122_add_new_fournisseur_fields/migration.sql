/*
  Warnings:

  - The values [SALON_COIFFURE_BEAUTE,PARFUMERIE_COSMETIQUE,BOULANGERIE_PATISSERIE,LIBRAIRIE_PAPETERIE,TRANSPORT_LOGISTIQUE,GESTION_IMMOBILIERE] on the enum `MetierType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[tenantId,numero]` on the table `Table` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `articleId` to the `PieceReparation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Reparation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Telephone` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "CommandeStatut" ADD VALUE 'PAYE';

-- AlterEnum
BEGIN;
CREATE TYPE "MetierType_new" AS ENUM ('DEPOT_BOISSONS', 'BOUTIQUE', 'QUINCAILLERIE', 'PHARMACIE', 'RESTAURANT', 'TELEPHONIE', 'SUPERMARCHE', 'CIMENT_BTP', 'PRESSING', 'GARAGE_AUTOMOBILE', 'ELEVAGE', 'SALON_BEAUTE', 'PARFUMERIE', 'BOULANGERIE', 'GLACIER_SNACK', 'LIBRAIRIE', 'CLINIQUE', 'TRANSPORT', 'IMMOBILIER', 'HOTEL');
ALTER TABLE "public"."Tenant" ALTER COLUMN "metier" DROP DEFAULT;
ALTER TABLE "Tenant" ALTER COLUMN "metier" TYPE "MetierType_new" USING ("metier"::text::"MetierType_new");
ALTER TYPE "MetierType" RENAME TO "MetierType_old";
ALTER TYPE "MetierType_new" RENAME TO "MetierType";
DROP TYPE "public"."MetierType_old";
ALTER TABLE "Tenant" ALTER COLUMN "metier" SET DEFAULT 'DEPOT_BOISSONS';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotifType" ADD VALUE 'STOCK_CRITIQUE';
ALTER TYPE "NotifType" ADD VALUE 'STOCK_RUPTURE';
ALTER TYPE "NotifType" ADD VALUE 'STOCK_EXPIRATION';
ALTER TYPE "NotifType" ADD VALUE 'RESERVATION_NOUVELLE';
ALTER TYPE "NotifType" ADD VALUE 'RESERVATION_ANNULEE';
ALTER TYPE "NotifType" ADD VALUE 'COMMANDE_NOUVELLE';
ALTER TYPE "NotifType" ADD VALUE 'COMMANDE_PRETE';
ALTER TYPE "NotifType" ADD VALUE 'COMMANDE_RETARD';
ALTER TYPE "NotifType" ADD VALUE 'REPARATION_PRETE';
ALTER TYPE "NotifType" ADD VALUE 'CHECKIN_HOTEL';
ALTER TYPE "NotifType" ADD VALUE 'CHECKOUT_HOTEL';
ALTER TYPE "NotifType" ADD VALUE 'CHAMBRE_MENAGE';
ALTER TYPE "NotifType" ADD VALUE 'RDV_RAPPEL';
ALTER TYPE "NotifType" ADD VALUE 'RDV_ANNULE';
ALTER TYPE "NotifType" ADD VALUE 'VACCINATION_PREVUE';
ALTER TYPE "NotifType" ADD VALUE 'LIVRAISON_TERMINEE';
ALTER TYPE "NotifType" ADD VALUE 'CONNEXION_SUSPECTE';
ALTER TYPE "NotifType" ADD VALUE 'TENTATIVE_ECHEC';
ALTER TYPE "NotifType" ADD VALUE 'ALERTE_PREDICTIVE';
ALTER TYPE "NotifType" ADD VALUE 'RAPPORT_JOURNALIER';

-- AlterEnum
ALTER TYPE "ReparationStatut" ADD VALUE 'IRREPARABLE';

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "categorieId" TEXT;

-- AlterTable
ALTER TABLE "Commande" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "serveurId" TEXT;

-- AlterTable
ALTER TABLE "Fournisseur" ADD COLUMN     "adresse" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "soldeInitial" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PieceReparation" ADD COLUMN     "articleId" TEXT NOT NULL,
ALTER COLUMN "quantite" SET DEFAULT 1,
ALTER COLUMN "prix" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Reparation" ADD COLUMN     "avance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "montantDevis" DOUBLE PRECISION,
ADD COLUMN     "montantFinal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "telephoneId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Table" ADD COLUMN     "nom" TEXT,
ALTER COLUMN "numero" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Telephone" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dateVente" TIMESTAMP(3),
ADD COLUMN     "imei2" TEXT,
ADD COLUMN     "ram" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Categorie" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "couleur" TEXT DEFAULT '#6366f1',
    "icone" TEXT DEFAULT '🏷️',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Categorie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "silenceStart" TEXT DEFAULT '22:00',
    "silenceEnd" TEXT DEFAULT '07:00',
    "disabledCategories" JSONB DEFAULT '[]',
    "dailyDigest" BOOLEAN NOT NULL DEFAULT false,
    "digestHour" INTEGER NOT NULL DEFAULT 8,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "type" "NotifType" NOT NULL,
    "channel" "NotifChannel" NOT NULL,
    "langue" TEXT NOT NULL DEFAULT 'fr',
    "titleTpl" TEXT NOT NULL,
    "messageTpl" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Categorie_tenantId_idx" ON "Categorie"("tenantId");

-- CreateIndex
CREATE INDEX "Categorie_tenantId_actif_idx" ON "Categorie"("tenantId", "actif");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "NotificationPreference_tenantId_idx" ON "NotificationPreference"("tenantId");

-- CreateIndex
CREATE INDEX "NotificationTemplate_tenantId_idx" ON "NotificationTemplate"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_type_channel_langue_key" ON "NotificationTemplate"("type", "channel", "langue");

-- CreateIndex
CREATE INDEX "Article_categorieId_idx" ON "Article"("categorieId");

-- CreateIndex
CREATE INDEX "Notification_tenantId_isRead_createdAt_idx" ON "Notification"("tenantId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_groupKey_idx" ON "Notification"("groupKey");

-- CreateIndex
CREATE UNIQUE INDEX "Table_tenantId_numero_key" ON "Table"("tenantId", "numero");

-- AddForeignKey
ALTER TABLE "Categorie" ADD CONSTRAINT "Categorie_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "Categorie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PieceReparation" ADD CONSTRAINT "PieceReparation_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reparation" ADD CONSTRAINT "Reparation_telephoneId_fkey" FOREIGN KEY ("telephoneId") REFERENCES "Telephone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationTemplate" ADD CONSTRAINT "NotificationTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
