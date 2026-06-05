-- CreateEnum
CREATE TYPE "ReparationStatut" AS ENUM ('RECU', 'EN_DIAGNOSTIC', 'EN_REPARATION', 'PRET', 'LIVRE', 'ANNULE');

-- CreateTable
CREATE TABLE "Telephone" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "imei" TEXT NOT NULL,
    "marque" TEXT NOT NULL,
    "modele" TEXT NOT NULL,
    "couleur" TEXT,
    "stockage" TEXT,
    "garantieMois" INTEGER NOT NULL DEFAULT 12,
    "dateAchat" TIMESTAMP(3),
    "vendu" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Telephone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reparation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "imei" TEXT,
    "marque" TEXT,
    "modele" TEXT,
    "probleme" TEXT NOT NULL,
    "diagnostic" TEXT,
    "montant" DOUBLE PRECISION,
    "statut" "ReparationStatut" NOT NULL DEFAULT 'RECU',
    "technicienId" TEXT,
    "dateDepot" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateRetrait" TIMESTAMP(3),

    CONSTRAINT "Reparation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PieceReparation" (
    "id" TEXT NOT NULL,
    "reparationId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prix" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PieceReparation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Telephone_articleId_key" ON "Telephone"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "Telephone_imei_key" ON "Telephone"("imei");

-- AddForeignKey
ALTER TABLE "Telephone" ADD CONSTRAINT "Telephone_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Telephone" ADD CONSTRAINT "Telephone_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reparation" ADD CONSTRAINT "Reparation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reparation" ADD CONSTRAINT "Reparation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PieceReparation" ADD CONSTRAINT "PieceReparation_reparationId_fkey" FOREIGN KEY ("reparationId") REFERENCES "Reparation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
