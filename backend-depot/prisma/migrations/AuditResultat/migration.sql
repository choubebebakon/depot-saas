-- CreateEnum
CREATE TYPE "AuditResultat" AS ENUM ('SUCCES', 'ECHEC');

-- AlterTable
ALTER TABLE "JournalAudit" ADD COLUMN     "motif" TEXT,
ADD COLUMN     "resultat" "AuditResultat" NOT NULL DEFAULT 'SUCCES',
ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "requestId" TEXT,
ADD COLUMN     "metier" TEXT;

-- CreateIndex
CREATE INDEX "JournalAudit_requestId_idx" ON "JournalAudit"("requestId");

-- CreateIndex
CREATE INDEX "JournalAudit_metier_idx" ON "JournalAudit"("metier");