-- CreateTable
CREATE TABLE "Medicament" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "numeroLot" TEXT NOT NULL,
    "dateExpiration" TIMESTAMP(3) NOT NULL,
    "dosage" TEXT,
    "famille" TEXT NOT NULL,
    "surOrdonnance" BOOLEAN NOT NULL DEFAULT false,
    "fournisseurId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Medicament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ordonnance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "medecin" TEXT,
    "photoUrl" TEXT,
    "dateEmise" TIMESTAMP(3) NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'EN_COURS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ordonnance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneOrdonnance" (
    "id" TEXT NOT NULL,
    "ordonnanceId" TEXT NOT NULL,
    "medicamentId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "posologie" TEXT,

    CONSTRAINT "LigneOrdonnance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Medicament_articleId_key" ON "Medicament"("articleId");

-- AddForeignKey
ALTER TABLE "Medicament" ADD CONSTRAINT "Medicament_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicament" ADD CONSTRAINT "Medicament_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicament" ADD CONSTRAINT "Medicament_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "Fournisseur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ordonnance" ADD CONSTRAINT "Ordonnance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ordonnance" ADD CONSTRAINT "Ordonnance_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneOrdonnance" ADD CONSTRAINT "LigneOrdonnance_ordonnanceId_fkey" FOREIGN KEY ("ordonnanceId") REFERENCES "Ordonnance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneOrdonnance" ADD CONSTRAINT "LigneOrdonnance_medicamentId_fkey" FOREIGN KEY ("medicamentId") REFERENCES "Medicament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
