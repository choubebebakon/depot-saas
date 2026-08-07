-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('STOCK_AJUSTEMENT_MANUEL', 'STOCK_ENTREE', 'STOCK_SORTIE', 'VENTE_CREATED');

-- CreateEnum
CREATE TYPE "AuditSeverite" AS ENUM ('NORMALE', 'CRITIQUE');

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "depotId" TEXT,
    "userId" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT,
    "valeurAvant" JSONB,
    "valeurApres" JSONB,
    "montant" DECIMAL(12,2),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "severite" "AuditSeverite" NOT NULL DEFAULT 'NORMALE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_userId_idx" ON "AuditLog"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_action_idx" ON "AuditLog"("tenantId", "action");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_severite_idx" ON "AuditLog"("tenantId", "severite");
