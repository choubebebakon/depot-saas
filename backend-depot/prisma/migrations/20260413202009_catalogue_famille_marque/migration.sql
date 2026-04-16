-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "format" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "marqueId" TEXT,
ADD COLUMN     "uniteParPalette" INTEGER NOT NULL DEFAULT 120;

-- CreateTable
CREATE TABLE "Famille" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '📦',
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Famille_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Marque" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "familleId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Marque_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Famille_tenantId_idx" ON "Famille"("tenantId");

-- CreateIndex
CREATE INDEX "Marque_familleId_idx" ON "Marque"("familleId");

-- CreateIndex
CREATE INDEX "Marque_tenantId_idx" ON "Marque"("tenantId");

-- CreateIndex
CREATE INDEX "Article_familleId_idx" ON "Article"("familleId");

-- CreateIndex
CREATE INDEX "Article_marqueId_idx" ON "Article"("marqueId");

-- AddForeignKey
ALTER TABLE "Famille" ADD CONSTRAINT "Famille_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Marque" ADD CONSTRAINT "Marque_familleId_fkey" FOREIGN KEY ("familleId") REFERENCES "Famille"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Marque" ADD CONSTRAINT "Marque_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_familleId_fkey" FOREIGN KEY ("familleId") REFERENCES "Famille"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_marqueId_fkey" FOREIGN KEY ("marqueId") REFERENCES "Marque"("id") ON DELETE SET NULL ON UPDATE CASCADE;
