-- AlterTable
ALTER TABLE "LigneVente" ADD COLUMN     "casierMixte" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "composition" JSONB,
ADD COLUMN     "conditionnementId" TEXT;

-- CreateTable
CREATE TABLE "Conditionnement" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantiteUnitaire" INTEGER NOT NULL,
    "prixVente" DOUBLE PRECISION NOT NULL,
    "articleId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Conditionnement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conditionnement_articleId_idx" ON "Conditionnement"("articleId");

-- CreateIndex
CREATE INDEX "Conditionnement_tenantId_idx" ON "Conditionnement"("tenantId");

-- AddForeignKey
ALTER TABLE "Conditionnement" ADD CONSTRAINT "Conditionnement_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conditionnement" ADD CONSTRAINT "Conditionnement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneVente" ADD CONSTRAINT "LigneVente_conditionnementId_fkey" FOREIGN KEY ("conditionnementId") REFERENCES "Conditionnement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
