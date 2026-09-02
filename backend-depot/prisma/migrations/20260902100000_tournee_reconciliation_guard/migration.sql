ALTER TABLE "TourneeWorkflow"
  ADD COLUMN "reconciledAt" TIMESTAMP(3);

-- Historical workflows are left nullable intentionally. New closures are guarded by the service.
CREATE INDEX "TourneeWorkflow_reconciled_idx"
  ON "TourneeWorkflow"("reconciledAt");
