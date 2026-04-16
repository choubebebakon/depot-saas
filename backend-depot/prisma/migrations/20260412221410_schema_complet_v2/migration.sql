-- CreateEnum
CREATE TYPE "StatutAbonnement" AS ENUM ('TRIAL', 'ACTIVE', 'GRACE', 'READ_ONLY', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PlanAbonnement" AS ENUM ('MENSUEL', 'ANNUEL');

-- CreateEnum
CREATE TYPE "RoleUser" AS ENUM ('PATRON', 'GERANT', 'CAISSIER', 'MAGASINIER', 'COMMERCIAL', 'COMPTABLE');

-- CreateEnum
CREATE TYPE "StatutVente" AS ENUM ('PAYE', 'ATTENTE', 'ANNULE');

-- CreateEnum
CREATE TYPE "TypeMouvement" AS ENUM ('ENTREE', 'SORTIE', 'SORTIE_VENTE', 'SORTIE_GRATUITE', 'TRANSFERT_SORTIE', 'TRANSFERT_ENTREE', 'AJUSTEMENT_INVENTAIRE', 'CASSE_AVARIE', 'RETOUR_CLIENT');

-- CreateEnum
CREATE TYPE "TypeMouvementCaisse" AS ENUM ('ENCAISSEMENT_VENTE', 'ENCAISSEMENT_DETTE', 'DECAISSEMENT_DEPENSE', 'DECAISSEMENT_VIDES', 'FOND_INITIAL', 'AJUSTEMENT');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('CASH', 'ORANGE_MONEY', 'MTN_MOMO', 'CREDIT', 'MIXTE');

-- CreateEnum
CREATE TYPE "StatutTournee" AS ENUM ('OUVERTE', 'CLOTURE_COMMERCIALE', 'VALIDEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "StatutReception" AS ENUM ('EN_COURS', 'VALIDEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "TypeConsigne" AS ENUM ('BOUTEILLE_33CL', 'BOUTEILLE_60CL', 'CASIER', 'PALETTE', 'PACK_EAU');

-- CreateEnum
CREATE TYPE "StatutDette" AS ENUM ('EN_COURS', 'PARTIELLEMENT_PAYEE', 'SOLDEE', 'EN_LITIGE');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "nomEntreprise" TEXT NOT NULL,
    "emailPatron" TEXT,
    "telephone" TEXT,
    "dateEssaiFin" TIMESTAMP(3),
    "estActif" BOOLEAN NOT NULL DEFAULT true,
    "graceUntil" TIMESTAMP(3),
    "statutAbonnement" "StatutAbonnement" NOT NULL DEFAULT 'TRIAL',
    "dateExpiration" TIMESTAMP(3),
    "plan" "PlanAbonnement",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaiementSouscription" (
    "id" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "devise" TEXT NOT NULL DEFAULT 'FCFA',
    "reference" TEXT,
    "statut" TEXT NOT NULL,
    "datePaiement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "PaiementSouscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "RoleUser" NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "emplacement" TEXT NOT NULL,
    "codePrefix" TEXT NOT NULL DEFAULT 'DEP',
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "prixVente" DOUBLE PRECISION NOT NULL,
    "prixAchat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "seuilCritique" INTEGER NOT NULL DEFAULT 0,
    "estConsigne" BOOLEAN NOT NULL DEFAULT false,
    "uniteParCasier" INTEGER NOT NULL DEFAULT 12,
    "uniteParPack" INTEGER NOT NULL DEFAULT 6,
    "familleId" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 0,
    "articleId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "tricycleId" TEXT,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MouvementStock" (
    "id" TEXT NOT NULL,
    "type" "TypeMouvement" NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,
    "motif" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "articleId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tourneeId" TEXT,

    CONSTRAINT "MouvementStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vente" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "statut" "StatutVente" NOT NULL DEFAULT 'ATTENTE',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motifAnnulation" TEXT,
    "modePaiement" "ModePaiement" NOT NULL DEFAULT 'CASH',
    "montantCash" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montantOM" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montantMoMo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montantCredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tenantId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "clientId" TEXT,
    "createurId" TEXT,
    "tourneeId" TEXT,

    CONSTRAINT "Vente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneVente" (
    "id" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "remise" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "venteId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,

    CONSTRAINT "LigneVente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT,
    "adresse" TEXT,
    "plafondCredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "soldeCredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetteClient" (
    "id" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "montantPaye" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "statut" "StatutDette" NOT NULL DEFAULT 'EN_COURS',
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "DetteClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypeConsigneConfig" (
    "id" TEXT NOT NULL,
    "type" "TypeConsigne" NOT NULL,
    "valeurXAF" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "TypeConsigneConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortefeuilleConsigne" (
    "id" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 0,
    "clientId" TEXT NOT NULL,
    "typeConsigneId" TEXT NOT NULL,

    CONSTRAINT "PortefeuilleConsigne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MouvementConsigne" (
    "id" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "estSortie" BOOLEAN NOT NULL,
    "estRemboursementCash" BOOLEAN NOT NULL DEFAULT false,
    "montantRembourse" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "motif" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "typeConsigneId" TEXT NOT NULL,
    "venteId" TEXT,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "MouvementConsigne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fournisseur" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT,
    "solde" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fournisseur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceptionFournisseur" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "statut" "StatutReception" NOT NULL DEFAULT 'EN_COURS',
    "modePaiement" "ModePaiement" NOT NULL DEFAULT 'CASH',
    "montantPaye" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montantDette" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "motifAnnulation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fournisseurId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "ReceptionFournisseur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneReception" (
    "id" TEXT NOT NULL,
    "quantiteCommandee" INTEGER NOT NULL DEFAULT 0,
    "quantiteLivree" INTEGER NOT NULL,
    "quantiteGratuite" INTEGER NOT NULL DEFAULT 0,
    "prixAchatUnitaire" DOUBLE PRECISION NOT NULL,
    "receptionId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,

    CONSTRAINT "LigneReception_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tricycle" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "estLibre" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Tricycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournee" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "statut" "StatutTournee" NOT NULL DEFAULT 'OUVERTE',
    "dateOuverture" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateCloture" TIMESTAMP(3),
    "cashRemis" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "omRemis" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "momoRemis" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "noteCloture" TEXT,
    "ecartStock" DOUBLE PRECISION,
    "noteValidation" TEXT,
    "siteId" TEXT NOT NULL,
    "tricycleId" TEXT NOT NULL,
    "commercialId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Tournee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneChargement" (
    "id" TEXT NOT NULL,
    "quantiteChargee" INTEGER NOT NULL,
    "quantiteRetour" INTEGER NOT NULL DEFAULT 0,
    "quantiteVendue" INTEGER NOT NULL DEFAULT 0,
    "tourneeId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,

    CONSTRAINT "LigneChargement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionCaisse" (
    "id" TEXT NOT NULL,
    "fondInitial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fondFinal" DOUBLE PRECISION,
    "ecart" DOUBLE PRECISION,
    "motifEcart" TEXT,
    "estOuverte" BOOLEAN NOT NULL DEFAULT true,
    "dateOuverture" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateCloture" TIMESTAMP(3),
    "siteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "SessionCaisse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MouvementCaisse" (
    "id" TEXT NOT NULL,
    "type" "TypeMouvementCaisse" NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "motif" TEXT,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "MouvementCaisse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Depense" (
    "id" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "motif" TEXT NOT NULL,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "siteId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Depense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaiementSouscription_tenantId_idx" ON "PaiementSouscription"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "Site_tenantId_idx" ON "Site"("tenantId");

-- CreateIndex
CREATE INDEX "Article_tenantId_idx" ON "Article"("tenantId");

-- CreateIndex
CREATE INDEX "Stock_siteId_idx" ON "Stock"("siteId");

-- CreateIndex
CREATE INDEX "Stock_articleId_idx" ON "Stock"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_articleId_siteId_key" ON "Stock"("articleId", "siteId");

-- CreateIndex
CREATE INDEX "MouvementStock_tenantId_idx" ON "MouvementStock"("tenantId");

-- CreateIndex
CREATE INDEX "MouvementStock_siteId_idx" ON "MouvementStock"("siteId");

-- CreateIndex
CREATE INDEX "MouvementStock_articleId_idx" ON "MouvementStock"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "Vente_reference_key" ON "Vente"("reference");

-- CreateIndex
CREATE INDEX "Vente_tenantId_idx" ON "Vente"("tenantId");

-- CreateIndex
CREATE INDEX "Vente_siteId_idx" ON "Vente"("siteId");

-- CreateIndex
CREATE INDEX "Vente_clientId_idx" ON "Vente"("clientId");

-- CreateIndex
CREATE INDEX "LigneVente_venteId_idx" ON "LigneVente"("venteId");

-- CreateIndex
CREATE INDEX "LigneVente_articleId_idx" ON "LigneVente"("articleId");

-- CreateIndex
CREATE INDEX "Client_tenantId_idx" ON "Client"("tenantId");

-- CreateIndex
CREATE INDEX "DetteClient_clientId_idx" ON "DetteClient"("clientId");

-- CreateIndex
CREATE INDEX "DetteClient_tenantId_idx" ON "DetteClient"("tenantId");

-- CreateIndex
CREATE INDEX "TypeConsigneConfig_tenantId_idx" ON "TypeConsigneConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TypeConsigneConfig_tenantId_type_key" ON "TypeConsigneConfig"("tenantId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "PortefeuilleConsigne_clientId_typeConsigneId_key" ON "PortefeuilleConsigne"("clientId", "typeConsigneId");

-- CreateIndex
CREATE INDEX "MouvementConsigne_tenantId_idx" ON "MouvementConsigne"("tenantId");

-- CreateIndex
CREATE INDEX "MouvementConsigne_venteId_idx" ON "MouvementConsigne"("venteId");

-- CreateIndex
CREATE INDEX "Fournisseur_tenantId_idx" ON "Fournisseur"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ReceptionFournisseur_reference_key" ON "ReceptionFournisseur"("reference");

-- CreateIndex
CREATE INDEX "ReceptionFournisseur_tenantId_idx" ON "ReceptionFournisseur"("tenantId");

-- CreateIndex
CREATE INDEX "ReceptionFournisseur_siteId_idx" ON "ReceptionFournisseur"("siteId");

-- CreateIndex
CREATE INDEX "LigneReception_receptionId_idx" ON "LigneReception"("receptionId");

-- CreateIndex
CREATE INDEX "Tricycle_tenantId_idx" ON "Tricycle"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Tournee_reference_key" ON "Tournee"("reference");

-- CreateIndex
CREATE INDEX "Tournee_tenantId_idx" ON "Tournee"("tenantId");

-- CreateIndex
CREATE INDEX "Tournee_siteId_idx" ON "Tournee"("siteId");

-- CreateIndex
CREATE INDEX "LigneChargement_tourneeId_idx" ON "LigneChargement"("tourneeId");

-- CreateIndex
CREATE INDEX "SessionCaisse_tenantId_idx" ON "SessionCaisse"("tenantId");

-- CreateIndex
CREATE INDEX "SessionCaisse_siteId_idx" ON "SessionCaisse"("siteId");

-- CreateIndex
CREATE INDEX "MouvementCaisse_sessionId_idx" ON "MouvementCaisse"("sessionId");

-- CreateIndex
CREATE INDEX "Depense_tenantId_idx" ON "Depense"("tenantId");

-- CreateIndex
CREATE INDEX "Depense_siteId_idx" ON "Depense"("siteId");

-- AddForeignKey
ALTER TABLE "PaiementSouscription" ADD CONSTRAINT "PaiementSouscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_tricycleId_fkey" FOREIGN KEY ("tricycleId") REFERENCES "Tricycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_tourneeId_fkey" FOREIGN KEY ("tourneeId") REFERENCES "Tournee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_createurId_fkey" FOREIGN KEY ("createurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_tourneeId_fkey" FOREIGN KEY ("tourneeId") REFERENCES "Tournee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneVente" ADD CONSTRAINT "LigneVente_venteId_fkey" FOREIGN KEY ("venteId") REFERENCES "Vente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneVente" ADD CONSTRAINT "LigneVente_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetteClient" ADD CONSTRAINT "DetteClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypeConsigneConfig" ADD CONSTRAINT "TypeConsigneConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortefeuilleConsigne" ADD CONSTRAINT "PortefeuilleConsigne_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortefeuilleConsigne" ADD CONSTRAINT "PortefeuilleConsigne_typeConsigneId_fkey" FOREIGN KEY ("typeConsigneId") REFERENCES "TypeConsigneConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementConsigne" ADD CONSTRAINT "MouvementConsigne_typeConsigneId_fkey" FOREIGN KEY ("typeConsigneId") REFERENCES "TypeConsigneConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementConsigne" ADD CONSTRAINT "MouvementConsigne_venteId_fkey" FOREIGN KEY ("venteId") REFERENCES "Vente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fournisseur" ADD CONSTRAINT "Fournisseur_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceptionFournisseur" ADD CONSTRAINT "ReceptionFournisseur_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "Fournisseur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceptionFournisseur" ADD CONSTRAINT "ReceptionFournisseur_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceptionFournisseur" ADD CONSTRAINT "ReceptionFournisseur_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneReception" ADD CONSTRAINT "LigneReception_receptionId_fkey" FOREIGN KEY ("receptionId") REFERENCES "ReceptionFournisseur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneReception" ADD CONSTRAINT "LigneReception_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tricycle" ADD CONSTRAINT "Tricycle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournee" ADD CONSTRAINT "Tournee_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournee" ADD CONSTRAINT "Tournee_tricycleId_fkey" FOREIGN KEY ("tricycleId") REFERENCES "Tricycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournee" ADD CONSTRAINT "Tournee_commercialId_fkey" FOREIGN KEY ("commercialId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournee" ADD CONSTRAINT "Tournee_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneChargement" ADD CONSTRAINT "LigneChargement_tourneeId_fkey" FOREIGN KEY ("tourneeId") REFERENCES "Tournee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneChargement" ADD CONSTRAINT "LigneChargement_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionCaisse" ADD CONSTRAINT "SessionCaisse_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionCaisse" ADD CONSTRAINT "SessionCaisse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionCaisse" ADD CONSTRAINT "SessionCaisse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementCaisse" ADD CONSTRAINT "MouvementCaisse_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SessionCaisse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Depense" ADD CONSTRAINT "Depense_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Depense" ADD CONSTRAINT "Depense_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
