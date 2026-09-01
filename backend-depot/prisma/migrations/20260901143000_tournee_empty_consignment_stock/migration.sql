CREATE TABLE "DepotConsigneStock" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "depotId" TEXT NOT NULL,
  "articleId" TEXT NOT NULL,
  "quantite" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DepotConsigneStock_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "DepotConsigneStock_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE CASCADE,
  CONSTRAINT "DepotConsigneStock_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE,
  CONSTRAINT "DepotConsigneStock_qty_check" CHECK ("quantite" >= 0),
  CONSTRAINT "DepotConsigneStock_unique" UNIQUE ("depotId", "articleId")
);
CREATE INDEX "DepotConsigneStock_tenant_depot_idx" ON "DepotConsigneStock"("tenantId", "depotId");
CREATE INDEX "DepotConsigneStock_article_idx" ON "DepotConsigneStock"("articleId");

CREATE OR REPLACE FUNCTION "gestock_prevent_closed_tournee_update"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD."statut" = 'CLOTUREE' THEN
    RAISE EXCEPTION 'Une tournée clôturée est immuable.' USING ERRCODE = '55000';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "TourneeWorkflow_immutable_trigger"
BEFORE UPDATE ON "TourneeWorkflow"
FOR EACH ROW EXECUTE FUNCTION "gestock_prevent_closed_tournee_update"();
