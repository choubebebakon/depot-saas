-- CreateEnum
CREATE TYPE "ChambreStatut" AS ENUM ('LIBRE', 'OCCUPEE', 'RESERVEE', 'EN_NETTOYAGE', 'HORS_SERVICE');

-- CreateEnum
CREATE TYPE "ReservationHotelStatut" AS ENUM ('CONFIRMEE', 'CHECKIN', 'CHECKOUT', 'ANNULEE', 'NO_SHOW');

-- CreateTable
CREATE TABLE "TypeChambre" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "capacite" INTEGER NOT NULL DEFAULT 1,
    "prixNuit" DOUBLE PRECISION NOT NULL,
    "equipements" TEXT,
    "imageUrl" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TypeChambre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chambre" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "etage" INTEGER,
    "typeChambreId" TEXT NOT NULL,
    "statut" "ChambreStatut" NOT NULL DEFAULT 'LIBRE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chambre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationHotel" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT,
    "chambreId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "nomClient" TEXT NOT NULL,
    "telephone" TEXT,
    "email" TEXT,
    "dateArrivee" TIMESTAMP(3) NOT NULL,
    "dateDepart" TIMESTAMP(3) NOT NULL,
    "nbNuits" INTEGER NOT NULL,
    "nbPersonnes" INTEGER NOT NULL DEFAULT 1,
    "prixTotal" DOUBLE PRECISION NOT NULL,
    "avance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "modePaiement" "ModePaiement" NOT NULL DEFAULT 'CASH',
    "statut" "ReservationHotelStatut" NOT NULL DEFAULT 'CONFIRMEE',
    "source" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservationHotel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsommationHotel" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "articleId" TEXT,
    "designation" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "prix" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsommationHotel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TypeChambre_tenantId_idx" ON "TypeChambre"("tenantId");

-- CreateIndex
CREATE INDEX "Chambre_tenantId_idx" ON "Chambre"("tenantId");

-- CreateIndex
CREATE INDEX "Chambre_statut_idx" ON "Chambre"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "Chambre_tenantId_numero_key" ON "Chambre"("tenantId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "ReservationHotel_reference_key" ON "ReservationHotel"("reference");

-- CreateIndex
CREATE INDEX "ReservationHotel_tenantId_idx" ON "ReservationHotel"("tenantId");

-- CreateIndex
CREATE INDEX "ReservationHotel_statut_idx" ON "ReservationHotel"("statut");

-- CreateIndex
CREATE INDEX "ReservationHotel_dateArrivee_idx" ON "ReservationHotel"("dateArrivee");

-- CreateIndex
CREATE INDEX "ReservationHotel_chambreId_idx" ON "ReservationHotel"("chambreId");

-- CreateIndex
CREATE INDEX "ConsommationHotel_reservationId_idx" ON "ConsommationHotel"("reservationId");

-- AddForeignKey
ALTER TABLE "TypeChambre" ADD CONSTRAINT "TypeChambre_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chambre" ADD CONSTRAINT "Chambre_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chambre" ADD CONSTRAINT "Chambre_typeChambreId_fkey" FOREIGN KEY ("typeChambreId") REFERENCES "TypeChambre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationHotel" ADD CONSTRAINT "ReservationHotel_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationHotel" ADD CONSTRAINT "ReservationHotel_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationHotel" ADD CONSTRAINT "ReservationHotel_chambreId_fkey" FOREIGN KEY ("chambreId") REFERENCES "Chambre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsommationHotel" ADD CONSTRAINT "ConsommationHotel_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "ReservationHotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsommationHotel" ADD CONSTRAINT "ConsommationHotel_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;
