-- CreateEnum
CREATE TYPE "LivraisonBTPStatut" AS ENUM ('PLANIFIEE', 'EN_ROUTE', 'LIVREE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "TicketPressingStatut" AS ENUM ('RECU', 'EN_TRAITEMENT', 'PRET', 'RETIRE', 'ANNULE');

-- CreateEnum
CREATE TYPE "EtatVetement" AS ENUM ('RECU', 'EN_TRAITEMENT', 'TRAITE', 'LIVRE');

-- CreateEnum
CREATE TYPE "GarageStatut" AS ENUM ('RECU', 'EN_DIAGNOSTIC', 'DEVIS_ENVOYE', 'EN_REPARATION', 'EN_ATTENTE_PIECES', 'PRET', 'LIVRE', 'ANNULE');

-- CreateEnum
CREATE TYPE "RdvStatut" AS ENUM ('CONFIRME', 'EN_COURS', 'TERMINE', 'ANNULE', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "CommandeSpecialeStatut" AS ENUM ('EN_ATTENTE', 'ARRIVE', 'LIVRE', 'ANNULE');

-- CreateEnum
CREATE TYPE "ConsultStatut" AS ENUM ('EN_COURS', 'TERMINEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "RdvMedicalStatut" AS ENUM ('PLANIFIE', 'CONFIRME', 'EN_COURS', 'TERMINE', 'ANNULE', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ColisStatut" AS ENUM ('ENREGISTRE', 'EN_TRANSIT', 'LIVRE', 'RETOUR', 'PERDU');

-- CreateEnum
CREATE TYPE "TrajetStatut" AS ENUM ('PLANIFIE', 'EN_COURS', 'TERMINE', 'ANNULE');

-- CreateEnum
CREATE TYPE "BienType" AS ENUM ('APPARTEMENT', 'MAISON', 'VILLA', 'LOCAL_COMMERCIAL', 'BUREAU', 'ENTREPOT', 'TERRAIN');

-- CreateEnum
CREATE TYPE "ContratStatut" AS ENUM ('ACTIF', 'EXPIRE', 'RESILIE', 'EN_ATTENTE');

-- CreateEnum
CREATE TYPE "PaiementLoyerStatut" AS ENUM ('PAYE', 'EN_RETARD', 'PARTIEL', 'IMPAYE');

-- CreateEnum
CREATE TYPE "ElevageStatut" AS ENUM ('ACTIF', 'VENDU', 'TERMINE');

-- CreateEnum
CREATE TYPE "EvenementElevageType" AS ENUM ('NAISSANCE', 'ACHAT', 'VENTE', 'MORTALITE', 'VACCINATION', 'TRAITEMENT', 'PESEE');

-- CreateTable
CREATE TABLE "Rayon" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "couleur" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rayon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RayonArticle" (
    "id" TEXT NOT NULL,
    "rayonId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,

    CONSTRAINT "RayonArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodeBarresArticle" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EAN13',
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CodeBarresArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehiculeBTP" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "immatriculation" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "capaciteKg" DOUBLE PRECISION,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehiculeBTP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LivraisonBTP" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "chantierId" TEXT NOT NULL,
    "vehiculeId" TEXT,
    "chauffeur" TEXT,
    "reference" TEXT NOT NULL,
    "statut" "LivraisonBTPStatut" NOT NULL DEFAULT 'PLANIFIEE',
    "datePlanifiee" TIMESTAMP(3),
    "dateLivraison" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LivraisonBTP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneLivraisonBTP" (
    "id" TEXT NOT NULL,
    "livraisonId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,
    "unite" TEXT NOT NULL DEFAULT 'PIECE',

    CONSTRAINT "LigneLivraisonBTP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketPressing" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "statut" "TicketPressingStatut" NOT NULL DEFAULT 'RECU',
    "dateDepot" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateRetrait" TIMESTAMP(3),
    "dateRetirée" TIMESTAMP(3),
    "montantTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketPressing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VetementPressing" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "couleur" TEXT,
    "marque" TEXT,
    "etat" "EtatVetement" NOT NULL DEFAULT 'RECU',
    "typeService" TEXT NOT NULL,
    "prix" DOUBLE PRECISION NOT NULL,
    "observations" TEXT,

    CONSTRAINT "VetementPressing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehiculeClient" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "immatriculation" TEXT NOT NULL,
    "marque" TEXT NOT NULL,
    "modele" TEXT NOT NULL,
    "annee" INTEGER,
    "couleur" TEXT,
    "kilometrage" DOUBLE PRECISION,
    "carburant" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehiculeClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FicheTravailGarage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vehiculeId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "problemeClient" TEXT NOT NULL,
    "diagnosticTech" TEXT,
    "travaux" TEXT,
    "montantPieces" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montantMO" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montantTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "statut" "GarageStatut" NOT NULL DEFAULT 'RECU',
    "technicienId" TEXT,
    "dateEntree" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateSortiePrev" TIMESTAMP(3),
    "dateSortie" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "FicheTravailGarage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PieceGarage" (
    "id" TEXT NOT NULL,
    "ficheId" TEXT NOT NULL,
    "articleId" TEXT,
    "designation" TEXT NOT NULL,
    "reference" TEXT,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "prix" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PieceGarage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotElevage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "espece" TEXT NOT NULL,
    "race" TEXT,
    "dateAcquisition" TIMESTAMP(3) NOT NULL,
    "nombreInitial" INTEGER NOT NULL,
    "nombreActuel" INTEGER NOT NULL,
    "poidsUnitMoyen" DOUBLE PRECISION,
    "statut" "ElevageStatut" NOT NULL DEFAULT 'ACTIF',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LotElevage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvenementElevage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "type" "EvenementElevageType" NOT NULL,
    "quantite" INTEGER NOT NULL,
    "poids" DOUBLE PRECISION,
    "montant" DOUBLE PRECISION,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvenementElevage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlimentationElevage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "quantiteKg" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "AlimentationElevage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prestation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "prix" DOUBLE PRECISION NOT NULL,
    "dureeMin" INTEGER,
    "categorie" TEXT,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prestation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RendezVousSalon" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT,
    "nomClient" TEXT NOT NULL,
    "telephone" TEXT,
    "employeId" TEXT,
    "dateHeure" TIMESTAMP(3) NOT NULL,
    "statut" "RdvStatut" NOT NULL DEFAULT 'CONFIRME',
    "montantTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RendezVousSalon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneRdv" (
    "id" TEXT NOT NULL,
    "rdvId" TEXT NOT NULL,
    "prestationId" TEXT NOT NULL,
    "prix" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "LigneRdv_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProduitCosmetique" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "marque" TEXT NOT NULL,
    "contenance" TEXT,
    "typesPeau" TEXT,
    "ingredients" TEXT,
    "certifications" TEXT,
    "categorie" TEXT NOT NULL,

    CONSTRAINT "ProduitCosmetique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgrammeFidelite" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "totalDepense" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "niveau" TEXT NOT NULL DEFAULT 'BRONZE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgrammeFidelite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoriqueFidelite" (
    "id" TEXT NOT NULL,
    "fideliteId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "motif" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoriqueFidelite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recette" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "instructions" TEXT,
    "tempsPrep" INTEGER,
    "tempsCuisson" INTEGER,
    "temperature" INTEGER,
    "portionsUnite" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recette_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientRecette" (
    "id" TEXT NOT NULL,
    "recetteId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,
    "unite" TEXT NOT NULL,

    CONSTRAINT "IngredientRecette_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionJour" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "recetteId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantiteProduite" INTEGER NOT NULL,
    "quantiteVendue" INTEGER NOT NULL DEFAULT 0,
    "quantiteInvendue" INTEGER NOT NULL DEFAULT 0,
    "coutProduction" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "ProductionJour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompositionGlace" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "contenant" TEXT NOT NULL,
    "parfums" TEXT NOT NULL,
    "supplements" TEXT,
    "prix" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CompositionGlace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LivreDetail" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "isbn" TEXT,
    "auteur" TEXT,
    "editeur" TEXT,
    "anneeParution" INTEGER,
    "genre" TEXT,
    "langue" TEXT DEFAULT 'FR',
    "nbPages" INTEGER,

    CONSTRAINT "LivreDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommandeSpeciale" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "isbn" TEXT,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "statut" "CommandeSpecialeStatut" NOT NULL DEFAULT 'EN_ATTENTE',
    "dateCommande" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateArrivee" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "CommandeSpeciale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DossierMedical" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "groupeSanguin" TEXT,
    "allergies" TEXT,
    "antecedents" TEXT,
    "traitementEnCours" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DossierMedical_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "medecinId" TEXT,
    "specialite" TEXT,
    "motif" TEXT NOT NULL,
    "examen" TEXT,
    "diagnostic" TEXT,
    "montant" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "statut" "ConsultStatut" NOT NULL DEFAULT 'EN_COURS',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "articleId" TEXT,
    "medicament" TEXT NOT NULL,
    "dosage" TEXT,
    "posologie" TEXT,
    "duree" TEXT,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RendezVousMedical" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "medecinId" TEXT,
    "specialite" TEXT,
    "dateHeure" TIMESTAMP(3) NOT NULL,
    "motif" TEXT,
    "statut" "RdvMedicalStatut" NOT NULL DEFAULT 'PLANIFIE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RendezVousMedical_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehiculeTransport" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "immatriculation" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "marque" TEXT,
    "modele" TEXT,
    "capaciteKg" DOUBLE PRECISION,
    "capaciteM3" DOUBLE PRECISION,
    "chauffeurId" TEXT,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehiculeTransport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Colis" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "expediteurId" TEXT,
    "destinataire" TEXT NOT NULL,
    "telephoneDest" TEXT,
    "adresseDest" TEXT NOT NULL,
    "villeDest" TEXT NOT NULL,
    "poids" DOUBLE PRECISION,
    "dimensions" TEXT,
    "description" TEXT,
    "valeur" DOUBLE PRECISION,
    "reference" TEXT NOT NULL,
    "statut" "ColisStatut" NOT NULL DEFAULT 'ENREGISTRE',
    "montant" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trajetId" TEXT,

    CONSTRAINT "Colis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trajet" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vehiculeId" TEXT,
    "chauffeurId" TEXT,
    "villeDepart" TEXT NOT NULL,
    "villeArrivee" TEXT NOT NULL,
    "dateDepart" TIMESTAMP(3) NOT NULL,
    "dateArrivee" TIMESTAMP(3),
    "distance" DOUBLE PRECISION,
    "montant" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "statut" "TrajetStatut" NOT NULL DEFAULT 'PLANIFIE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trajet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BienImmobilier" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "type" "BienType" NOT NULL,
    "adresse" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "surface" DOUBLE PRECISION,
    "nbPieces" INTEGER,
    "etage" INTEGER,
    "loyer" DOUBLE PRECISION NOT NULL,
    "charges" DOUBLE PRECISION,
    "depot" DOUBLE PRECISION,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BienImmobilier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContratLocation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bienId" TEXT NOT NULL,
    "locataireId" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "loyer" DOUBLE PRECISION NOT NULL,
    "charges" DOUBLE PRECISION,
    "depot" DOUBLE PRECISION,
    "statut" "ContratStatut" NOT NULL DEFAULT 'ACTIF',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContratLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaiementLoyer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contratId" TEXT NOT NULL,
    "mois" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "charges" DOUBLE PRECISION DEFAULT 0,
    "modePaiement" "ModePaiement" NOT NULL DEFAULT 'CASH',
    "statut" "PaiementLoyerStatut" NOT NULL DEFAULT 'PAYE',
    "datePaiement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateEcheance" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "PaiementLoyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterventionBien" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bienId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cout" DOUBLE PRECISION,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" TEXT NOT NULL DEFAULT 'EFFECTUEE',

    CONSTRAINT "InterventionBien_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Rayon_tenantId_idx" ON "Rayon"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "RayonArticle_rayonId_articleId_key" ON "RayonArticle"("rayonId", "articleId");

-- CreateIndex
CREATE UNIQUE INDEX "CodeBarresArticle_code_key" ON "CodeBarresArticle"("code");

-- CreateIndex
CREATE INDEX "CodeBarresArticle_tenantId_idx" ON "CodeBarresArticle"("tenantId");

-- CreateIndex
CREATE INDEX "CodeBarresArticle_code_idx" ON "CodeBarresArticle"("code");

-- CreateIndex
CREATE INDEX "VehiculeBTP_tenantId_idx" ON "VehiculeBTP"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "LivraisonBTP_reference_key" ON "LivraisonBTP"("reference");

-- CreateIndex
CREATE INDEX "LivraisonBTP_tenantId_idx" ON "LivraisonBTP"("tenantId");

-- CreateIndex
CREATE INDEX "LivraisonBTP_chantierId_idx" ON "LivraisonBTP"("chantierId");

-- CreateIndex
CREATE INDEX "LigneLivraisonBTP_livraisonId_idx" ON "LigneLivraisonBTP"("livraisonId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketPressing_reference_key" ON "TicketPressing"("reference");

-- CreateIndex
CREATE INDEX "TicketPressing_tenantId_idx" ON "TicketPressing"("tenantId");

-- CreateIndex
CREATE INDEX "TicketPressing_clientId_idx" ON "TicketPressing"("clientId");

-- CreateIndex
CREATE INDEX "TicketPressing_statut_idx" ON "TicketPressing"("statut");

-- CreateIndex
CREATE INDEX "VetementPressing_ticketId_idx" ON "VetementPressing"("ticketId");

-- CreateIndex
CREATE INDEX "VehiculeClient_tenantId_idx" ON "VehiculeClient"("tenantId");

-- CreateIndex
CREATE INDEX "VehiculeClient_clientId_idx" ON "VehiculeClient"("clientId");

-- CreateIndex
CREATE INDEX "VehiculeClient_immatriculation_idx" ON "VehiculeClient"("immatriculation");

-- CreateIndex
CREATE UNIQUE INDEX "FicheTravailGarage_reference_key" ON "FicheTravailGarage"("reference");

-- CreateIndex
CREATE INDEX "FicheTravailGarage_tenantId_idx" ON "FicheTravailGarage"("tenantId");

-- CreateIndex
CREATE INDEX "FicheTravailGarage_statut_idx" ON "FicheTravailGarage"("statut");

-- CreateIndex
CREATE INDEX "PieceGarage_ficheId_idx" ON "PieceGarage"("ficheId");

-- CreateIndex
CREATE INDEX "LotElevage_tenantId_idx" ON "LotElevage"("tenantId");

-- CreateIndex
CREATE INDEX "LotElevage_statut_idx" ON "LotElevage"("statut");

-- CreateIndex
CREATE INDEX "EvenementElevage_tenantId_idx" ON "EvenementElevage"("tenantId");

-- CreateIndex
CREATE INDEX "EvenementElevage_lotId_idx" ON "EvenementElevage"("lotId");

-- CreateIndex
CREATE INDEX "AlimentationElevage_tenantId_idx" ON "AlimentationElevage"("tenantId");

-- CreateIndex
CREATE INDEX "AlimentationElevage_lotId_idx" ON "AlimentationElevage"("lotId");

-- CreateIndex
CREATE INDEX "Prestation_tenantId_idx" ON "Prestation"("tenantId");

-- CreateIndex
CREATE INDEX "RendezVousSalon_tenantId_idx" ON "RendezVousSalon"("tenantId");

-- CreateIndex
CREATE INDEX "RendezVousSalon_dateHeure_idx" ON "RendezVousSalon"("dateHeure");

-- CreateIndex
CREATE INDEX "RendezVousSalon_statut_idx" ON "RendezVousSalon"("statut");

-- CreateIndex
CREATE INDEX "LigneRdv_rdvId_idx" ON "LigneRdv"("rdvId");

-- CreateIndex
CREATE UNIQUE INDEX "ProduitCosmetique_articleId_key" ON "ProduitCosmetique"("articleId");

-- CreateIndex
CREATE INDEX "ProduitCosmetique_tenantId_idx" ON "ProduitCosmetique"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammeFidelite_clientId_key" ON "ProgrammeFidelite"("clientId");

-- CreateIndex
CREATE INDEX "ProgrammeFidelite_tenantId_idx" ON "ProgrammeFidelite"("tenantId");

-- CreateIndex
CREATE INDEX "HistoriqueFidelite_fideliteId_idx" ON "HistoriqueFidelite"("fideliteId");

-- CreateIndex
CREATE UNIQUE INDEX "Recette_articleId_key" ON "Recette"("articleId");

-- CreateIndex
CREATE INDEX "Recette_tenantId_idx" ON "Recette"("tenantId");

-- CreateIndex
CREATE INDEX "IngredientRecette_recetteId_idx" ON "IngredientRecette"("recetteId");

-- CreateIndex
CREATE INDEX "ProductionJour_tenantId_idx" ON "ProductionJour"("tenantId");

-- CreateIndex
CREATE INDEX "ProductionJour_date_idx" ON "ProductionJour"("date");

-- CreateIndex
CREATE UNIQUE INDEX "CompositionGlace_commandeId_key" ON "CompositionGlace"("commandeId");

-- CreateIndex
CREATE INDEX "CompositionGlace_tenantId_idx" ON "CompositionGlace"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "LivreDetail_articleId_key" ON "LivreDetail"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "LivreDetail_isbn_key" ON "LivreDetail"("isbn");

-- CreateIndex
CREATE INDEX "LivreDetail_tenantId_idx" ON "LivreDetail"("tenantId");

-- CreateIndex
CREATE INDEX "CommandeSpeciale_tenantId_idx" ON "CommandeSpeciale"("tenantId");

-- CreateIndex
CREATE INDEX "CommandeSpeciale_statut_idx" ON "CommandeSpeciale"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "DossierMedical_clientId_key" ON "DossierMedical"("clientId");

-- CreateIndex
CREATE INDEX "DossierMedical_tenantId_idx" ON "DossierMedical"("tenantId");

-- CreateIndex
CREATE INDEX "Consultation_tenantId_idx" ON "Consultation"("tenantId");

-- CreateIndex
CREATE INDEX "Consultation_dossierId_idx" ON "Consultation"("dossierId");

-- CreateIndex
CREATE INDEX "Prescription_consultationId_idx" ON "Prescription"("consultationId");

-- CreateIndex
CREATE INDEX "RendezVousMedical_tenantId_idx" ON "RendezVousMedical"("tenantId");

-- CreateIndex
CREATE INDEX "RendezVousMedical_dateHeure_idx" ON "RendezVousMedical"("dateHeure");

-- CreateIndex
CREATE INDEX "VehiculeTransport_tenantId_idx" ON "VehiculeTransport"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Colis_reference_key" ON "Colis"("reference");

-- CreateIndex
CREATE INDEX "Colis_tenantId_idx" ON "Colis"("tenantId");

-- CreateIndex
CREATE INDEX "Colis_statut_idx" ON "Colis"("statut");

-- CreateIndex
CREATE INDEX "Colis_reference_idx" ON "Colis"("reference");

-- CreateIndex
CREATE INDEX "Trajet_tenantId_idx" ON "Trajet"("tenantId");

-- CreateIndex
CREATE INDEX "Trajet_statut_idx" ON "Trajet"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "BienImmobilier_reference_key" ON "BienImmobilier"("reference");

-- CreateIndex
CREATE INDEX "BienImmobilier_tenantId_idx" ON "BienImmobilier"("tenantId");

-- CreateIndex
CREATE INDEX "BienImmobilier_disponible_idx" ON "BienImmobilier"("disponible");

-- CreateIndex
CREATE INDEX "ContratLocation_tenantId_idx" ON "ContratLocation"("tenantId");

-- CreateIndex
CREATE INDEX "ContratLocation_statut_idx" ON "ContratLocation"("statut");

-- CreateIndex
CREATE INDEX "ContratLocation_bienId_idx" ON "ContratLocation"("bienId");

-- CreateIndex
CREATE INDEX "PaiementLoyer_tenantId_idx" ON "PaiementLoyer"("tenantId");

-- CreateIndex
CREATE INDEX "PaiementLoyer_statut_idx" ON "PaiementLoyer"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "PaiementLoyer_contratId_mois_key" ON "PaiementLoyer"("contratId", "mois");

-- CreateIndex
CREATE INDEX "InterventionBien_tenantId_idx" ON "InterventionBien"("tenantId");

-- CreateIndex
CREATE INDEX "InterventionBien_bienId_idx" ON "InterventionBien"("bienId");

-- AddForeignKey
ALTER TABLE "Rayon" ADD CONSTRAINT "Rayon_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RayonArticle" ADD CONSTRAINT "RayonArticle_rayonId_fkey" FOREIGN KEY ("rayonId") REFERENCES "Rayon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RayonArticle" ADD CONSTRAINT "RayonArticle_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeBarresArticle" ADD CONSTRAINT "CodeBarresArticle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeBarresArticle" ADD CONSTRAINT "CodeBarresArticle_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiculeBTP" ADD CONSTRAINT "VehiculeBTP_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivraisonBTP" ADD CONSTRAINT "LivraisonBTP_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivraisonBTP" ADD CONSTRAINT "LivraisonBTP_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "Chantier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivraisonBTP" ADD CONSTRAINT "LivraisonBTP_vehiculeId_fkey" FOREIGN KEY ("vehiculeId") REFERENCES "VehiculeBTP"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneLivraisonBTP" ADD CONSTRAINT "LigneLivraisonBTP_livraisonId_fkey" FOREIGN KEY ("livraisonId") REFERENCES "LivraisonBTP"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneLivraisonBTP" ADD CONSTRAINT "LigneLivraisonBTP_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketPressing" ADD CONSTRAINT "TicketPressing_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketPressing" ADD CONSTRAINT "TicketPressing_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VetementPressing" ADD CONSTRAINT "VetementPressing_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "TicketPressing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiculeClient" ADD CONSTRAINT "VehiculeClient_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiculeClient" ADD CONSTRAINT "VehiculeClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FicheTravailGarage" ADD CONSTRAINT "FicheTravailGarage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FicheTravailGarage" ADD CONSTRAINT "FicheTravailGarage_vehiculeId_fkey" FOREIGN KEY ("vehiculeId") REFERENCES "VehiculeClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PieceGarage" ADD CONSTRAINT "PieceGarage_ficheId_fkey" FOREIGN KEY ("ficheId") REFERENCES "FicheTravailGarage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PieceGarage" ADD CONSTRAINT "PieceGarage_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotElevage" ADD CONSTRAINT "LotElevage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvenementElevage" ADD CONSTRAINT "EvenementElevage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvenementElevage" ADD CONSTRAINT "EvenementElevage_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "LotElevage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlimentationElevage" ADD CONSTRAINT "AlimentationElevage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlimentationElevage" ADD CONSTRAINT "AlimentationElevage_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "LotElevage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlimentationElevage" ADD CONSTRAINT "AlimentationElevage_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prestation" ADD CONSTRAINT "Prestation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RendezVousSalon" ADD CONSTRAINT "RendezVousSalon_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RendezVousSalon" ADD CONSTRAINT "RendezVousSalon_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneRdv" ADD CONSTRAINT "LigneRdv_rdvId_fkey" FOREIGN KEY ("rdvId") REFERENCES "RendezVousSalon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneRdv" ADD CONSTRAINT "LigneRdv_prestationId_fkey" FOREIGN KEY ("prestationId") REFERENCES "Prestation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProduitCosmetique" ADD CONSTRAINT "ProduitCosmetique_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProduitCosmetique" ADD CONSTRAINT "ProduitCosmetique_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammeFidelite" ADD CONSTRAINT "ProgrammeFidelite_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammeFidelite" ADD CONSTRAINT "ProgrammeFidelite_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriqueFidelite" ADD CONSTRAINT "HistoriqueFidelite_fideliteId_fkey" FOREIGN KEY ("fideliteId") REFERENCES "ProgrammeFidelite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recette" ADD CONSTRAINT "Recette_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recette" ADD CONSTRAINT "Recette_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientRecette" ADD CONSTRAINT "IngredientRecette_recetteId_fkey" FOREIGN KEY ("recetteId") REFERENCES "Recette"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientRecette" ADD CONSTRAINT "IngredientRecette_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionJour" ADD CONSTRAINT "ProductionJour_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionJour" ADD CONSTRAINT "ProductionJour_recetteId_fkey" FOREIGN KEY ("recetteId") REFERENCES "Recette"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompositionGlace" ADD CONSTRAINT "CompositionGlace_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompositionGlace" ADD CONSTRAINT "CompositionGlace_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "Commande"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivreDetail" ADD CONSTRAINT "LivreDetail_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivreDetail" ADD CONSTRAINT "LivreDetail_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandeSpeciale" ADD CONSTRAINT "CommandeSpeciale_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandeSpeciale" ADD CONSTRAINT "CommandeSpeciale_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierMedical" ADD CONSTRAINT "DossierMedical_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierMedical" ADD CONSTRAINT "DossierMedical_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "DossierMedical"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RendezVousMedical" ADD CONSTRAINT "RendezVousMedical_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RendezVousMedical" ADD CONSTRAINT "RendezVousMedical_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiculeTransport" ADD CONSTRAINT "VehiculeTransport_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colis" ADD CONSTRAINT "Colis_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colis" ADD CONSTRAINT "Colis_expediteurId_fkey" FOREIGN KEY ("expediteurId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colis" ADD CONSTRAINT "Colis_trajetId_fkey" FOREIGN KEY ("trajetId") REFERENCES "Trajet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trajet" ADD CONSTRAINT "Trajet_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trajet" ADD CONSTRAINT "Trajet_vehiculeId_fkey" FOREIGN KEY ("vehiculeId") REFERENCES "VehiculeTransport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BienImmobilier" ADD CONSTRAINT "BienImmobilier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratLocation" ADD CONSTRAINT "ContratLocation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratLocation" ADD CONSTRAINT "ContratLocation_bienId_fkey" FOREIGN KEY ("bienId") REFERENCES "BienImmobilier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratLocation" ADD CONSTRAINT "ContratLocation_locataireId_fkey" FOREIGN KEY ("locataireId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaiementLoyer" ADD CONSTRAINT "PaiementLoyer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaiementLoyer" ADD CONSTRAINT "PaiementLoyer_contratId_fkey" FOREIGN KEY ("contratId") REFERENCES "ContratLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionBien" ADD CONSTRAINT "InterventionBien_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionBien" ADD CONSTRAINT "InterventionBien_bienId_fkey" FOREIGN KEY ("bienId") REFERENCES "BienImmobilier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
