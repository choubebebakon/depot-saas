-- CreateEnum
CREATE TYPE "TypeMaintenance" AS ENUM ('VIDANGE', 'PNEU', 'FREINS', 'CARBURANT', 'REPARATION', 'REVISION', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutMaintenance" AS ENUM ('PLANIFIE', 'EFFECTUE', 'ANNULE');

-- CreateTable
CREATE TABLE "MaintenanceTricycle" (
    "id" TEXT NOT NULL,
    "type" "TypeMaintenance" NOT NULL,
    "statut" "StatutMaintenance" NOT NULL DEFAULT 'PLANIFIE',
    "description" TEXT NOT NULL,
    "cout" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kilometrage" DOUBLE PRECISION,
    "photoUrl" TEXT,
    "dateEffectue" TIMESTAMP(3),
    "datePlanifie" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tricycleId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "MaintenanceTricycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsommationCarburant" (
    "id" TEXT NOT NULL,
    "litres" DOUBLE PRECISION NOT NULL,
    "prixLitre" DOUBLE PRECISION NOT NULL,
    "montantTotal" DOUBLE PRECISION NOT NULL,
    "kilometrage" DOUBLE PRECISION,
    "nbTours" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tricycleId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "ConsommationCarburant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "tauxApplique" DOUBLE PRECISION NOT NULL,
    "periode" TEXT NOT NULL,
    "estPayee" BOOLEAN NOT NULL DEFAULT false,
    "datePaiement" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParametreCommission" (
    "id" TEXT NOT NULL,
    "taux" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "estActif" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "ParametreCommission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaintenanceTricycle_tricycleId_idx" ON "MaintenanceTricycle"("tricycleId");

-- CreateIndex
CREATE INDEX "MaintenanceTricycle_tenantId_idx" ON "MaintenanceTricycle"("tenantId");

-- CreateIndex
CREATE INDEX "ConsommationCarburant_tricycleId_idx" ON "ConsommationCarburant"("tricycleId");

-- CreateIndex
CREATE INDEX "ConsommationCarburant_tenantId_idx" ON "ConsommationCarburant"("tenantId");

-- CreateIndex
CREATE INDEX "Commission_tenantId_idx" ON "Commission"("tenantId");

-- CreateIndex
CREATE INDEX "Commission_userId_idx" ON "Commission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Commission_userId_periode_key" ON "Commission"("userId", "periode");

-- CreateIndex
CREATE INDEX "ParametreCommission_tenantId_idx" ON "ParametreCommission"("tenantId");

-- AddForeignKey
ALTER TABLE "MaintenanceTricycle" ADD CONSTRAINT "MaintenanceTricycle_tricycleId_fkey" FOREIGN KEY ("tricycleId") REFERENCES "Tricycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTricycle" ADD CONSTRAINT "MaintenanceTricycle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsommationCarburant" ADD CONSTRAINT "ConsommationCarburant_tricycleId_fkey" FOREIGN KEY ("tricycleId") REFERENCES "Tricycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsommationCarburant" ADD CONSTRAINT "ConsommationCarburant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParametreCommission" ADD CONSTRAINT "ParametreCommission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
