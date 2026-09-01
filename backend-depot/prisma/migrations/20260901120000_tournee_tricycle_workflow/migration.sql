CREATE TABLE "TourneeWorkflow" (
  "id" TEXT PRIMARY KEY,
  "reference" TEXT NOT NULL UNIQUE,
  "statut" TEXT NOT NULL DEFAULT 'PLANIFIEE',
  "tenantId" TEXT NOT NULL,
  "depotId" TEXT NOT NULL,
  "tricycleId" TEXT NOT NULL,
  "commercialId" TEXT NOT NULL,
  "tourneeId" TEXT NOT NULL UNIQUE,
  "datePlanifiee" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dateDepart" TIMESTAMP(3),
  "dateCloture" TIMESTAMP(3),
  "cashReel" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "orangeMoneyReel" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "mtnMomoReel" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "montantEncaisseReel" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "caTheorique" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "ecartCaisse" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalQuantiteChargee" INTEGER NOT NULL DEFAULT 0,
  "totalValeurChargee" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "immutable" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TourneeWorkflow_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "TourneeWorkflow_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE CASCADE,
  CONSTRAINT "TourneeWorkflow_tricycleId_fkey" FOREIGN KEY ("tricycleId") REFERENCES "Tricycle"("id") ON DELETE RESTRICT,
  CONSTRAINT "TourneeWorkflow_commercialId_fkey" FOREIGN KEY ("commercialId") REFERENCES "User"("id") ON DELETE RESTRICT,
  CONSTRAINT "TourneeWorkflow_tourneeId_fkey" FOREIGN KEY ("tourneeId") REFERENCES "Tournee"("id") ON DELETE CASCADE,
  CONSTRAINT "TourneeWorkflow_statut_check" CHECK ("statut" IN ('PLANIFIEE','EN_COURS','CLOTUREE'))
);

CREATE TABLE "TourneeWorkflowLine" (
  "id" TEXT PRIMARY KEY,
  "workflowId" TEXT NOT NULL,
  "articleId" TEXT NOT NULL,
  "quantiteChargee" INTEGER NOT NULL,
  "prixUnitaireFacture" DOUBLE PRECISION NOT NULL,
  "quantiteRetourPleins" INTEGER NOT NULL DEFAULT 0,
  "quantiteRetourVides" INTEGER NOT NULL DEFAULT 0,
  "quantiteVendueTheorique" INTEGER NOT NULL DEFAULT 0,
  "caTheorique" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TourneeWorkflowLine_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "TourneeWorkflow"("id") ON DELETE CASCADE,
  CONSTRAINT "TourneeWorkflowLine_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT,
  CONSTRAINT "TourneeWorkflowLine_qty_check" CHECK ("quantiteChargee" > 0),
  CONSTRAINT "TourneeWorkflowLine_price_check" CHECK ("prixUnitaireFacture" >= 0),
  CONSTRAINT "TourneeWorkflowLine_return_check" CHECK ("quantiteRetourPleins" >= 0 AND "quantiteRetourVides" >= 0)
);

CREATE TABLE "DetteCommerciale" (
  "id" TEXT PRIMARY KEY,
  "reference" TEXT NOT NULL UNIQUE,
  "montant" DOUBLE PRECISION NOT NULL,
  "montantPaye" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "statut" TEXT NOT NULL DEFAULT 'EN_COURS',
  "commercialId" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL UNIQUE,
  "tenantId" TEXT NOT NULL,
  "depotId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DetteCommerciale_commercialId_fkey" FOREIGN KEY ("commercialId") REFERENCES "User"("id") ON DELETE RESTRICT,
  CONSTRAINT "DetteCommerciale_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "TourneeWorkflow"("id") ON DELETE RESTRICT,
  CONSTRAINT "DetteCommerciale_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "DetteCommerciale_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE CASCADE,
  CONSTRAINT "DetteCommerciale_status_check" CHECK ("statut" IN ('EN_COURS','PARTIELLEMENT_PAYEE','SOLDEE','EN_LITIGE'))
);

CREATE INDEX "TourneeWorkflow_tenant_depot_statut_idx" ON "TourneeWorkflow"("tenantId","depotId","statut");
CREATE INDEX "TourneeWorkflow_commercial_idx" ON "TourneeWorkflow"("commercialId");
CREATE INDEX "TourneeWorkflow_tricycle_idx" ON "TourneeWorkflow"("tricycleId");
CREATE INDEX "TourneeWorkflowLine_workflow_idx" ON "TourneeWorkflowLine"("workflowId");
CREATE INDEX "TourneeWorkflowLine_article_idx" ON "TourneeWorkflowLine"("articleId");
CREATE INDEX "DetteCommerciale_commercial_idx" ON "DetteCommerciale"("commercialId");
CREATE INDEX "DetteCommerciale_tenant_depot_idx" ON "DetteCommerciale"("tenantId","depotId");
