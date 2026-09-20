-- CreateEnum (idempotent : le type peut déjà exister si la migration a été
-- appliquée manuellement ou via db push avant l'enregistrement du dossier).
DO $$ BEGIN
  CREATE TYPE "AuditResultat" AS ENUM ('SUCCES', 'ECHEC');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable (idempotent : les colonnes peuvent déjà exister)
ALTER TABLE "JournalAudit" ADD COLUMN IF NOT EXISTS "motif" TEXT;
ALTER TABLE "JournalAudit" ADD COLUMN IF NOT EXISTS "resultat" "AuditResultat" NOT NULL DEFAULT 'SUCCES';
ALTER TABLE "JournalAudit" ADD COLUMN IF NOT EXISTS "sessionId" TEXT;
ALTER TABLE "JournalAudit" ADD COLUMN IF NOT EXISTS "requestId" TEXT;
ALTER TABLE "JournalAudit" ADD COLUMN IF NOT EXISTS "metier" TEXT;

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "JournalAudit_requestId_idx" ON "JournalAudit"("requestId");
CREATE INDEX IF NOT EXISTS "JournalAudit_metier_idx" ON "JournalAudit"("metier");