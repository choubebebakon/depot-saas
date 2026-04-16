-- CreateTable
CREATE TABLE "LotStock" (
    "id" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 0,
    "quantiteInitiale" INTEGER NOT NULL DEFAULT 0,
    "dlc" TIMESTAMP(3),
    "numeroLot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "articleId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "LotStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LotStock_articleId_idx" ON "LotStock"("articleId");

-- CreateIndex
CREATE INDEX "LotStock_siteId_idx" ON "LotStock"("siteId");

-- CreateIndex
CREATE INDEX "LotStock_tenantId_idx" ON "LotStock"("tenantId");

-- CreateIndex
CREATE INDEX "LotStock_dlc_idx" ON "LotStock"("dlc");

-- AddForeignKey
ALTER TABLE "LotStock" ADD CONSTRAINT "LotStock_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotStock" ADD CONSTRAINT "LotStock_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotStock" ADD CONSTRAINT "LotStock_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
