-- CreateEnum
CREATE TYPE "StatutVente" AS ENUM ('PAYE', 'ATTENTE', 'ANNULE');

-- CreateEnum
CREATE TYPE "TypeMouvement" AS ENUM ('ENTREE', 'SORTIE', 'SORTIE_VENTE', 'SORTIE_GRATUITE', 'TRANSFERT_SORTIE', 'TRANSFERT_ENTREE', 'AJUSTEMENT_INVENTAIRE', 'CASSE_AVARIE', 'RETOUR_CLIENT');

-- CreateEnum
CREATE TYPE "StatutTransfert" AS ENUM ('BROUILLON', 'EN_COURS', 'TERMINE', 'ANNULE');

-- CreateEnum
CREATE TYPE "StatutCommande" AS ENUM ('BROUILLON', 'ENVOYE', 'RECU', 'ANNULE');

-- CreateEnum
CREATE TYPE "TypeMouvementCaisse" AS ENUM ('ENCAISSEMENT_VENTE', 'ENCAISSEMENT_DETTE', 'DECAISSEMENT_DEPENSE', 'DECAISSEMENT_VIDES', 'FOND_INITIAL', 'AJUSTEMENT');

-- CreateEnum
CREATE TYPE "TypeMaintenance" AS ENUM ('VIDANGE', 'PNEU', 'FREINS', 'CARBURANT', 'REPARATION', 'REVISION', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutMaintenance" AS ENUM ('PLANIFIE', 'EFFECTUE', 'ANNULE');

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

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PATRON', 'GERANT', 'CAISSIER', 'MAGASINIER', 'COMMERCIAL', 'COMPTABLE', 'ADMIN');

-- CreateEnum
CREATE TYPE "RoleUser" AS ENUM ('PATRON', 'GERANT', 'CAISSIER', 'MAGASINIER', 'COMMERCIAL', 'COMPTABLE', 'ADMIN');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('TRIAL', 'ACTIVE', 'GRACE', 'GRACE_PERIOD', 'EXPIRED', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "StatutAbonnement" AS ENUM ('TRIAL', 'ACTIVE', 'GRACE', 'EXPIRED', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE', 'SOLO', 'PME', 'TRIAL', 'UNLIMITED');

-- CreateEnum
CREATE TYPE "PlanAbonnement" AS ENUM ('MENSUEL', 'ANNUEL');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "NotifType" AS ENUM ('EXPIRY_WARNING', 'EXPIRY_J7', 'EXPIRY_J3', 'EXPIRY_J1', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'ORANGE_MONEY', 'MTN_MOMO', 'STRIPE', 'VISA_CARD', 'MASTERCARD');

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

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT '',
    "prixVente" DOUBLE PRECISION NOT NULL,
    "prixAchat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "seuilCritique" INTEGER NOT NULL DEFAULT 0,
    "estConsigne" BOOLEAN NOT NULL DEFAULT false,
    "uniteParCasier" INTEGER NOT NULL DEFAULT 12,
    "uniteParPack" INTEGER NOT NULL DEFAULT 6,
    "uniteParPalette" INTEGER NOT NULL DEFAULT 120,
    "familleId" TEXT,
    "marqueId" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 0,
    "seuilCritique" INTEGER,
    "articleId" TEXT NOT NULL,
    "depotId" TEXT NOT NULL,
    "tricycleId" TEXT,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotStock" (
    "id" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 0,
    "quantiteInitiale" INTEGER NOT NULL DEFAULT 0,
    "dlc" TIMESTAMP(3),
    "numeroLot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "articleId" TEXT NOT NULL,
    "depotId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "LotStock_pkey" PRIMARY KEY ("id")
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
    "depotId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tourneeId" TEXT,

    CONSTRAINT "MouvementStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransfertStock" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "statut" "StatutTransfert" NOT NULL DEFAULT 'BROUILLON',
    "motif" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sourceDepotId" TEXT NOT NULL,
    "destDepotId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "TransfertStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneTransfert" (
    "id" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "transfertId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,

    CONSTRAINT "LigneTransfert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommandeFournisseur" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "statut" "StatutCommande" NOT NULL DEFAULT 'BROUILLON',
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dateCommande" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateReceptionPrev" TIMESTAMP(3),
    "note" TEXT,
    "fournisseurId" TEXT NOT NULL,
    "depotId" TEXT NOT NULL,
    "createurId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "CommandeFournisseur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneCommandeFournisseur" (
    "id" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixAchatUnit" DOUBLE PRECISION NOT NULL,
    "commandeId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,

    CONSTRAINT "LigneCommandeFournisseur_pkey" PRIMARY KEY ("id")
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
    "depotId" TEXT NOT NULL,
    "clientId" TEXT,
    "createurId" TEXT,
    "tourneeId" TEXT,

    CONSTRAINT "Vente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneVente" (
    "id" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prix" DOUBLE PRECISION NOT NULL,
    "remise" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "venteId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "conditionnementId" TEXT,
    "casierMixte" BOOLEAN NOT NULL DEFAULT false,
    "composition" JSONB,

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
    "depotId" TEXT,
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
    "depotId" TEXT,

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
    "depotId" TEXT,

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
    "depotId" TEXT,

    CONSTRAINT "MouvementConsigne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fournisseur" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT,
    "solde" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tenantId" TEXT NOT NULL,
    "depotId" TEXT,
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
    "numBordereau" TEXT,
    "motifAnnulation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fournisseurId" TEXT NOT NULL,
    "depotId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "ReceptionFournisseur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneReception" (
    "id" TEXT NOT NULL,
    "quantiteCommandee" INTEGER NOT NULL DEFAULT 0,
    "quantiteLivree" INTEGER NOT NULL,
    "quantiteGratuite" INTEGER NOT NULL DEFAULT 0,
    "uniteUsed" TEXT,
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
    "depotId" TEXT,

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
    "depotId" TEXT NOT NULL,
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
    "depotId" TEXT NOT NULL,
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
    "depotId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Depense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalAudit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "depotId" TEXT,
    "actorUserId" TEXT,
    "actorEmail" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "reference" TEXT,
    "description" TEXT NOT NULL,
    "metadataText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceTricycle" (
    "id" TEXT NOT NULL,
    "type" "TypeMaintenance" NOT NULL,
    "statut" "StatutMaintenance" NOT NULL DEFAULT 'PLANIFIE',
    "description" TEXT NOT NULL,
    "cout" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kilometrage" DOUBLE PRECISION,
    "photoUrl" TEXT,
    "dateEffectue" TIMESTAMP(3),
    "datePlanifie" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tricycleId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "depotId" TEXT,

    CONSTRAINT "MaintenanceTricycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsommationCarburant" (
    "id" TEXT NOT NULL,
    "litres" DOUBLE PRECISION NOT NULL,
    "prixLitre" DOUBLE PRECISION NOT NULL,
    "montantTotal" DOUBLE PRECISION NOT NULL,
    "kilometrage" DOUBLE PRECISION,
    "nbTours" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tricycleId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "depotId" TEXT,

    CONSTRAINT "ConsommationCarburant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "tauxApplique" DOUBLE PRECISION NOT NULL,
    "periode" TEXT NOT NULL,
    "estPayee" BOOLEAN NOT NULL DEFAULT false,
    "datePaiement" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "depotId" TEXT,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParametreCommission" (
    "id" TEXT NOT NULL,
    "taux" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "estActif" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "ParametreCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "nomEntreprise" TEXT,
    "emailPatron" TEXT,
    "telephone" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'TRIAL',
    "statutAbonnement" "StatutAbonnement" NOT NULL DEFAULT 'TRIAL',
    "plan" TEXT,
    "planAbonnement" "PlanAbonnement",
    "planType" "PlanType" NOT NULL DEFAULT 'FREE',
    "subscriptionEnd" TIMESTAMP(3),
    "dateExpiration" TIMESTAMP(3),
    "dateEssaiFin" TIMESTAMP(3),
    "maxDepots" INTEGER NOT NULL DEFAULT 5,
    "lastPaymentId" TEXT,
    "estActif" BOOLEAN NOT NULL DEFAULT true,
    "graceUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slogan" TEXT,
    "adresse" TEXT,
    "logo" TEXT,
    "messageFin" TEXT DEFAULT 'Merci de votre fidélité !',

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "refreshTokenHash" TEXT,
    "role" "Role" NOT NULL,
    "nom" TEXT,
    "tenantId" TEXT NOT NULL,
    "depotId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Depot" (
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "emplacement" TEXT NOT NULL,
    "codePrefix" TEXT NOT NULL DEFAULT 'DEP',
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Depot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "tvaAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'FCFA',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" "PaymentMethod" NOT NULL,
    "planPurchased" TEXT,
    "billingCycle" TEXT,
    "reference" TEXT,
    "notchPayId" TEXT,
    "operatorTxId" TEXT,
    "stripePaymentIntentId" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" "NotifType" NOT NULL,
    "title" TEXT,
    "message" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaiementSouscription_tenantId_idx" ON "PaiementSouscription"("tenantId");

-- CreateIndex
CREATE INDEX "Famille_tenantId_idx" ON "Famille"("tenantId");

-- CreateIndex
CREATE INDEX "Marque_familleId_idx" ON "Marque"("familleId");

-- CreateIndex
CREATE INDEX "Marque_tenantId_idx" ON "Marque"("tenantId");

-- CreateIndex
CREATE INDEX "Article_tenantId_idx" ON "Article"("tenantId");

-- CreateIndex
CREATE INDEX "Article_familleId_idx" ON "Article"("familleId");

-- CreateIndex
CREATE INDEX "Article_marqueId_idx" ON "Article"("marqueId");

-- CreateIndex
CREATE INDEX "Conditionnement_articleId_idx" ON "Conditionnement"("articleId");

-- CreateIndex
CREATE INDEX "Conditionnement_tenantId_idx" ON "Conditionnement"("tenantId");

-- CreateIndex
CREATE INDEX "Stock_depotId_idx" ON "Stock"("depotId");

-- CreateIndex
CREATE INDEX "Stock_articleId_idx" ON "Stock"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_articleId_depotId_key" ON "Stock"("articleId", "depotId");

-- CreateIndex
CREATE INDEX "LotStock_articleId_idx" ON "LotStock"("articleId");

-- CreateIndex
CREATE INDEX "LotStock_depotId_idx" ON "LotStock"("depotId");

-- CreateIndex
CREATE INDEX "LotStock_tenantId_idx" ON "LotStock"("tenantId");

-- CreateIndex
CREATE INDEX "LotStock_dlc_idx" ON "LotStock"("dlc");

-- CreateIndex
CREATE INDEX "MouvementStock_tenantId_idx" ON "MouvementStock"("tenantId");

-- CreateIndex
CREATE INDEX "MouvementStock_depotId_idx" ON "MouvementStock"("depotId");

-- CreateIndex
CREATE INDEX "MouvementStock_articleId_idx" ON "MouvementStock"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "TransfertStock_reference_key" ON "TransfertStock"("reference");

-- CreateIndex
CREATE INDEX "TransfertStock_tenantId_idx" ON "TransfertStock"("tenantId");

-- CreateIndex
CREATE INDEX "LigneTransfert_transfertId_idx" ON "LigneTransfert"("transfertId");

-- CreateIndex
CREATE UNIQUE INDEX "CommandeFournisseur_reference_key" ON "CommandeFournisseur"("reference");

-- CreateIndex
CREATE INDEX "CommandeFournisseur_tenantId_idx" ON "CommandeFournisseur"("tenantId");

-- CreateIndex
CREATE INDEX "CommandeFournisseur_depotId_idx" ON "CommandeFournisseur"("depotId");

-- CreateIndex
CREATE INDEX "LigneCommandeFournisseur_commandeId_idx" ON "LigneCommandeFournisseur"("commandeId");

-- CreateIndex
CREATE UNIQUE INDEX "Vente_reference_key" ON "Vente"("reference");

-- CreateIndex
CREATE INDEX "Vente_tenantId_idx" ON "Vente"("tenantId");

-- CreateIndex
CREATE INDEX "Vente_depotId_idx" ON "Vente"("depotId");

-- CreateIndex
CREATE INDEX "Vente_clientId_idx" ON "Vente"("clientId");

-- CreateIndex
CREATE INDEX "LigneVente_venteId_idx" ON "LigneVente"("venteId");

-- CreateIndex
CREATE INDEX "LigneVente_articleId_idx" ON "LigneVente"("articleId");

-- CreateIndex
CREATE INDEX "Client_tenantId_idx" ON "Client"("tenantId");

-- CreateIndex
CREATE INDEX "Client_depotId_idx" ON "Client"("depotId");

-- CreateIndex
CREATE INDEX "DetteClient_clientId_idx" ON "DetteClient"("clientId");

-- CreateIndex
CREATE INDEX "DetteClient_tenantId_idx" ON "DetteClient"("tenantId");

-- CreateIndex
CREATE INDEX "DetteClient_depotId_idx" ON "DetteClient"("depotId");

-- CreateIndex
CREATE INDEX "TypeConsigneConfig_tenantId_idx" ON "TypeConsigneConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TypeConsigneConfig_tenantId_type_key" ON "TypeConsigneConfig"("tenantId", "type");

-- CreateIndex
CREATE INDEX "PortefeuilleConsigne_depotId_idx" ON "PortefeuilleConsigne"("depotId");

-- CreateIndex
CREATE UNIQUE INDEX "PortefeuilleConsigne_clientId_typeConsigneId_key" ON "PortefeuilleConsigne"("clientId", "typeConsigneId");

-- CreateIndex
CREATE INDEX "MouvementConsigne_tenantId_idx" ON "MouvementConsigne"("tenantId");

-- CreateIndex
CREATE INDEX "MouvementConsigne_venteId_idx" ON "MouvementConsigne"("venteId");

-- CreateIndex
CREATE INDEX "MouvementConsigne_depotId_idx" ON "MouvementConsigne"("depotId");

-- CreateIndex
CREATE INDEX "Fournisseur_tenantId_idx" ON "Fournisseur"("tenantId");

-- CreateIndex
CREATE INDEX "Fournisseur_depotId_idx" ON "Fournisseur"("depotId");

-- CreateIndex
CREATE UNIQUE INDEX "ReceptionFournisseur_reference_key" ON "ReceptionFournisseur"("reference");

-- CreateIndex
CREATE INDEX "ReceptionFournisseur_tenantId_idx" ON "ReceptionFournisseur"("tenantId");

-- CreateIndex
CREATE INDEX "ReceptionFournisseur_depotId_idx" ON "ReceptionFournisseur"("depotId");

-- CreateIndex
CREATE INDEX "LigneReception_receptionId_idx" ON "LigneReception"("receptionId");

-- CreateIndex
CREATE INDEX "Tricycle_tenantId_idx" ON "Tricycle"("tenantId");

-- CreateIndex
CREATE INDEX "Tricycle_depotId_idx" ON "Tricycle"("depotId");

-- CreateIndex
CREATE UNIQUE INDEX "Tournee_reference_key" ON "Tournee"("reference");

-- CreateIndex
CREATE INDEX "Tournee_tenantId_idx" ON "Tournee"("tenantId");

-- CreateIndex
CREATE INDEX "Tournee_depotId_idx" ON "Tournee"("depotId");

-- CreateIndex
CREATE INDEX "LigneChargement_tourneeId_idx" ON "LigneChargement"("tourneeId");

-- CreateIndex
CREATE INDEX "SessionCaisse_tenantId_idx" ON "SessionCaisse"("tenantId");

-- CreateIndex
CREATE INDEX "SessionCaisse_depotId_idx" ON "SessionCaisse"("depotId");

-- CreateIndex
CREATE INDEX "MouvementCaisse_sessionId_idx" ON "MouvementCaisse"("sessionId");

-- CreateIndex
CREATE INDEX "Depense_tenantId_idx" ON "Depense"("tenantId");

-- CreateIndex
CREATE INDEX "Depense_depotId_idx" ON "Depense"("depotId");

-- CreateIndex
CREATE INDEX "JournalAudit_tenantId_createdAt_idx" ON "JournalAudit"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "JournalAudit_action_idx" ON "JournalAudit"("action");

-- CreateIndex
CREATE INDEX "JournalAudit_depotId_idx" ON "JournalAudit"("depotId");

-- CreateIndex
CREATE INDEX "MaintenanceTricycle_tricycleId_idx" ON "MaintenanceTricycle"("tricycleId");

-- CreateIndex
CREATE INDEX "MaintenanceTricycle_tenantId_idx" ON "MaintenanceTricycle"("tenantId");

-- CreateIndex
CREATE INDEX "MaintenanceTricycle_depotId_idx" ON "MaintenanceTricycle"("depotId");

-- CreateIndex
CREATE INDEX "ConsommationCarburant_tricycleId_idx" ON "ConsommationCarburant"("tricycleId");

-- CreateIndex
CREATE INDEX "ConsommationCarburant_tenantId_idx" ON "ConsommationCarburant"("tenantId");

-- CreateIndex
CREATE INDEX "ConsommationCarburant_depotId_idx" ON "ConsommationCarburant"("depotId");

-- CreateIndex
CREATE INDEX "Commission_tenantId_idx" ON "Commission"("tenantId");

-- CreateIndex
CREATE INDEX "Commission_userId_idx" ON "Commission"("userId");

-- CreateIndex
CREATE INDEX "Commission_depotId_idx" ON "Commission"("depotId");

-- CreateIndex
CREATE UNIQUE INDEX "Commission_userId_periode_key" ON "Commission"("userId", "periode");

-- CreateIndex
CREATE INDEX "ParametreCommission_tenantId_idx" ON "ParametreCommission"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "User_depotId_idx" ON "User"("depotId");

-- CreateIndex
CREATE INDEX "Depot_tenantId_idx" ON "Depot"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_notchPayId_key" ON "Payment"("notchPayId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_operatorTxId_key" ON "Payment"("operatorTxId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Payment_tenantId_idx" ON "Payment"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "Notification_tenantId_idx" ON "Notification"("tenantId");

-- AddForeignKey
ALTER TABLE "PaiementSouscription" ADD CONSTRAINT "PaiementSouscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conditionnement" ADD CONSTRAINT "Conditionnement_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conditionnement" ADD CONSTRAINT "Conditionnement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_tricycleId_fkey" FOREIGN KEY ("tricycleId") REFERENCES "Tricycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotStock" ADD CONSTRAINT "LotStock_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotStock" ADD CONSTRAINT "LotStock_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotStock" ADD CONSTRAINT "LotStock_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_tourneeId_fkey" FOREIGN KEY ("tourneeId") REFERENCES "Tournee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransfertStock" ADD CONSTRAINT "TransfertStock_destDepotId_fkey" FOREIGN KEY ("destDepotId") REFERENCES "Depot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransfertStock" ADD CONSTRAINT "TransfertStock_sourceDepotId_fkey" FOREIGN KEY ("sourceDepotId") REFERENCES "Depot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransfertStock" ADD CONSTRAINT "TransfertStock_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneTransfert" ADD CONSTRAINT "LigneTransfert_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneTransfert" ADD CONSTRAINT "LigneTransfert_transfertId_fkey" FOREIGN KEY ("transfertId") REFERENCES "TransfertStock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandeFournisseur" ADD CONSTRAINT "CommandeFournisseur_createurId_fkey" FOREIGN KEY ("createurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandeFournisseur" ADD CONSTRAINT "CommandeFournisseur_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandeFournisseur" ADD CONSTRAINT "CommandeFournisseur_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "Fournisseur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandeFournisseur" ADD CONSTRAINT "CommandeFournisseur_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneCommandeFournisseur" ADD CONSTRAINT "LigneCommandeFournisseur_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneCommandeFournisseur" ADD CONSTRAINT "LigneCommandeFournisseur_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "CommandeFournisseur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_createurId_fkey" FOREIGN KEY ("createurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_tourneeId_fkey" FOREIGN KEY ("tourneeId") REFERENCES "Tournee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneVente" ADD CONSTRAINT "LigneVente_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneVente" ADD CONSTRAINT "LigneVente_conditionnementId_fkey" FOREIGN KEY ("conditionnementId") REFERENCES "Conditionnement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneVente" ADD CONSTRAINT "LigneVente_venteId_fkey" FOREIGN KEY ("venteId") REFERENCES "Vente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetteClient" ADD CONSTRAINT "DetteClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetteClient" ADD CONSTRAINT "DetteClient_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypeConsigneConfig" ADD CONSTRAINT "TypeConsigneConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortefeuilleConsigne" ADD CONSTRAINT "PortefeuilleConsigne_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortefeuilleConsigne" ADD CONSTRAINT "PortefeuilleConsigne_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortefeuilleConsigne" ADD CONSTRAINT "PortefeuilleConsigne_typeConsigneId_fkey" FOREIGN KEY ("typeConsigneId") REFERENCES "TypeConsigneConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementConsigne" ADD CONSTRAINT "MouvementConsigne_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementConsigne" ADD CONSTRAINT "MouvementConsigne_typeConsigneId_fkey" FOREIGN KEY ("typeConsigneId") REFERENCES "TypeConsigneConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementConsigne" ADD CONSTRAINT "MouvementConsigne_venteId_fkey" FOREIGN KEY ("venteId") REFERENCES "Vente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fournisseur" ADD CONSTRAINT "Fournisseur_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fournisseur" ADD CONSTRAINT "Fournisseur_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceptionFournisseur" ADD CONSTRAINT "ReceptionFournisseur_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceptionFournisseur" ADD CONSTRAINT "ReceptionFournisseur_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "Fournisseur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceptionFournisseur" ADD CONSTRAINT "ReceptionFournisseur_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneReception" ADD CONSTRAINT "LigneReception_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneReception" ADD CONSTRAINT "LigneReception_receptionId_fkey" FOREIGN KEY ("receptionId") REFERENCES "ReceptionFournisseur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tricycle" ADD CONSTRAINT "Tricycle_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tricycle" ADD CONSTRAINT "Tricycle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournee" ADD CONSTRAINT "Tournee_commercialId_fkey" FOREIGN KEY ("commercialId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournee" ADD CONSTRAINT "Tournee_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournee" ADD CONSTRAINT "Tournee_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournee" ADD CONSTRAINT "Tournee_tricycleId_fkey" FOREIGN KEY ("tricycleId") REFERENCES "Tricycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneChargement" ADD CONSTRAINT "LigneChargement_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneChargement" ADD CONSTRAINT "LigneChargement_tourneeId_fkey" FOREIGN KEY ("tourneeId") REFERENCES "Tournee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionCaisse" ADD CONSTRAINT "SessionCaisse_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionCaisse" ADD CONSTRAINT "SessionCaisse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionCaisse" ADD CONSTRAINT "SessionCaisse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementCaisse" ADD CONSTRAINT "MouvementCaisse_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SessionCaisse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Depense" ADD CONSTRAINT "Depense_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Depense" ADD CONSTRAINT "Depense_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalAudit" ADD CONSTRAINT "JournalAudit_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTricycle" ADD CONSTRAINT "MaintenanceTricycle_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTricycle" ADD CONSTRAINT "MaintenanceTricycle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTricycle" ADD CONSTRAINT "MaintenanceTricycle_tricycleId_fkey" FOREIGN KEY ("tricycleId") REFERENCES "Tricycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsommationCarburant" ADD CONSTRAINT "ConsommationCarburant_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsommationCarburant" ADD CONSTRAINT "ConsommationCarburant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsommationCarburant" ADD CONSTRAINT "ConsommationCarburant_tricycleId_fkey" FOREIGN KEY ("tricycleId") REFERENCES "Tricycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParametreCommission" ADD CONSTRAINT "ParametreCommission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Depot" ADD CONSTRAINT "Depot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
