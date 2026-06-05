-- CreateEnum
CREATE TYPE "TableStatut" AS ENUM ('LIBRE', 'OCCUPEE', 'RESERVEE');

-- CreateEnum
CREATE TYPE "CommandeStatut" AS ENUM ('EN_ATTENTE', 'EN_PREPARATION', 'PRET', 'SERVI', 'ANNULE');

-- CreateEnum
CREATE TYPE "CommandeType" AS ENUM ('SUR_PLACE', 'A_EMPORTER', 'LIVRAISON');

-- CreateTable
CREATE TABLE "Table" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "capacite" INTEGER NOT NULL,
    "statut" "TableStatut" NOT NULL DEFAULT 'LIBRE',

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commande" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tableId" TEXT,
    "clientId" TEXT,
    "statut" "CommandeStatut" NOT NULL DEFAULT 'EN_ATTENTE',
    "type" "CommandeType" NOT NULL DEFAULT 'SUR_PLACE',
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneCommande" (
    "id" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "platId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "note" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',

    CONSTRAINT "LigneCommande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plat" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prix" DOUBLE PRECISION NOT NULL,
    "categorie" TEXT NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "tempsPrep" INTEGER,

    CONSTRAINT "Plat_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commande" ADD CONSTRAINT "Commande_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commande" ADD CONSTRAINT "Commande_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneCommande" ADD CONSTRAINT "LigneCommande_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "Commande"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneCommande" ADD CONSTRAINT "LigneCommande_platId_fkey" FOREIGN KEY ("platId") REFERENCES "Plat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plat" ADD CONSTRAINT "Plat_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
