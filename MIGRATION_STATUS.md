# État de la migration GeStock — Contexte pour reprise

## Méthode en cours
Migration progressive de chaque module métier vers le pattern :
react-hook-form + zod + react-query (useSectorQuery) + suppression
du "Shield Runtime" (code mort défensif ~54 lignes/fichier).

## Module de référence (100% terminé, NE PAS TOUCHER)
`frontend-depot/src/modules/depot-boissons/` — pattern à dupliquer
tel quel pour les autres secteurs.

## Module en cours : Boutique
Dernier commit : 4c49819 "feat(boutique): migrate Rapports to useQuery + boutiqueApi"

### Terminé (sous-modules 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
- Infrastructure : boutiqueApi.js créé (modèle supermarcheApi.js) ✅
- Backend socle : CRUD Articles, Stock, Clients, Fournisseurs, Dépenses, Personnel ✅
- Backend socle : 26 endpoints créés + 2 existants mis à jour ✅
- Backend socle : Tous les endpoints filtrent par tenantId ✅
- Backend socle : NotFoundException sur lookups par id ✅
- Sous-module 2 : Stock/Articles frontend migré (StockPage.jsx + StockBoutiqueForm.jsx) ✅
- Sous-module 3 : Ventes/Caisse backend + frontend migré ✅
  - Backend : POST /boutique/ventes avec transaction Prisma (vente, lignes, stock décrément, MouvementStock) ✅
  - Frontend : VenteBoutiqueForm.jsx (rhf + zod + useFieldArray) ✅
  - Frontend : CaissePage.jsx (POS) ✅
  - Frontend : FacturesPage.jsx (vue filtrée ventes PAYEES) ✅
- Sous-module 4 : Promotions backend PUT/DELETE + frontend migré ✅
  - Backend : PUT /boutique/promotions/:id, DELETE /boutique/promotions/:id ✅
  - Frontend : PromotionsPage.jsx (useQuery + boutiqueApi) ✅
- Sous-module 5 : Clients frontend migré ✅
  - Frontend : ClientsPage.jsx (useQuery + boutiqueApi) ✅
  - Query key : ['boutique-clients'] ✅
- Sous-module 6 : Fournisseurs frontend migré ✅
  - Frontend : FournisseursPage.jsx (useQuery + boutiqueApi) ✅
  - Query key : ['boutique-fournisseurs'] ✅
- Sous-module 7 : Personnel frontend + mapping VENDEUR/COMMERCIAL ✅
  - Frontend : PersonnelPage.jsx (useQuery + boutiqueApi) ✅
  - Frontend : PersonnelBoutiqueForm.jsx (rhf + zod + mapping bidirectionnel) ✅
  - Mapping : VENDEUR (affichage utilisateur) ↔ COMMERCIAL (API) ✅
- Sous-module 8 : Dépenses frontend migré ✅
  - Frontend : DepenseBoutiqueForm.jsx (rhf + zod) ✅
  - Frontend : DepensesPage.jsx (useQuery + boutiqueApi) ✅
  - Schema : libelle, montant (coerce number positive), categorie, modePaiement, notes ✅
  - Query key : ['boutique-depenses'] → invalidate ['boutique-dashboard'] ✅
- Sous-module 9 : Rapports backend endpoint + frontend migré ✅
  - Backend : GET /boutique/rapports endpoint créé (pattern Supermarché) ✅
  - Backend : Aggrégations CA, top articles, depenses sur période ✅
  - Frontend : RapportsPage.jsx (useQuery + boutiqueApi) ✅
  - Query key : ['boutique-rapports'] ✅
- Sous-module 10 : Paramètres frontend migré ✅
  - Frontend : ParametresPage.jsx (rhf + zod + useQuery + useMutation) ✅
  - Backend : PUT /boutique/parametres stub existant ✅
  - Query key : ['boutique-parametres'] ✅

### Analyse - Sous-module 11 (Dashboard)
**Backend Status:**
- GET /boutique/stats endpoint does NOT exist (no "stats" or "getStats" found in boutique module)
- The boutique.controller.ts has stub endpoints for parametres and caisse, but no stats endpoint

**Frontend DashboardBoutique.jsx expects:**
- caJour: CA du jour
- ventesJour: Ventes du jour
- clientsActifs: Clients actifs
- stockCritique: Ruptures stock
- totalProduits: Produits en stock
- caisseJour: Caisse du jour

**dashboard.config.js defines:**
- Widgets with separate API paths:
  - /boutique/stats/ventes-jour
  - /boutique/stats/stock-critique
  - /boutique/stats/clients-actifs
  - /boutique/stats/caisse-jour
- Graphs:
  - /boutique/stats/ventes-mois
  - /boutique/stats/ca-mensuel
  - /boutique/stats/repartition-categories

**Gap Analysis:**
1. Boutique has NO stats endpoint at all - needs to be created from scratch
2. DashboardBoutique.jsx uses a single endpoint (`/${prefix}/stats`) but dashboard.config.js suggests separate endpoints for each widget/graph
3. Frontend expects data that doesn't exist in backend
4. Need to decide whether to follow Supermarché pattern (single endpoint) or dashboard.config.js pattern (separate endpoints)

**Recommendation:**
- Follow Supermarché pattern: create GET /boutique/stats single endpoint returning all dashboard metrics
- Use Prisma transactions for efficiency (like Supermarché getStats)
- Metrics to include: caJour, ventesJour, clientsActifs, stockCritique, totalProduits, caisseJour
- Migrate DashboardBoutique.jsx to useQuery with boutiqueApi
- Remove shield runtime code

### Dette technique résolue (FRONTEND)
**COMMERCIAL vs VENDEUR** :
- Le modèle `User` utilise l'enum `Role` avec valeur `COMMERCIAL`
- Le fichier `permissions.js` de Boutique utilise `VENDEUR` au lieu de `COMMERCIAL`
- Solution : Mapping bidirectionnel dans PersonnelBoutiqueForm.jsx
  - Schéma zod : role enum avec VENDEUR pour affichage utilisateur
  - À la soumission : mapper VENDEUR → COMMERCIAL avant envoi API
  - Au chargement (edit) : mapper COMMERCIAL → VENDEUR pour affichage
- Dette documentée pour résolution propre future (renommer enum ou aligner permissions.js)
- Impact : Fonctionnel via mapping frontend, pas de modification backend requise

### Règles impératives
- Un sous-module = un commit, avec build avant chaque commit
- Ne PAS toucher depot-boissons (référence stable)
- Chaque méthode backend DOIT filtrer par tenantId
- Supprimer le shield UNIQUEMENT dans les fichiers migrés dans le
  même commit — pas avant, pas après

## Sous-modules restants (ordre)
11. Dashboard (backend endpoint + frontend) - Analyse effectuée, endpoint à créer
12. Admin (validation finale du module Boutique)

## Module en cours : Supermarché
Dernier commit : 87668b8 "feat(supermarche): remove shield runtime — 6 fichiers, −321 lignes"

### Terminé (sous-modules 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13)
- Infrastructure : useSectorQuery.js, supermarcheApi.js ✅
- Stock/Articles : ArticleSupermarcheForm + StockPage migrés, shield supprimé ✅
- Rayons : RayonForm + RayonsPage migrés, shield supprimé ✅
- Backend : createVente décrémente le stock (transaction Prisma) ✅
- Backend : findAllArticles inclut relation rayon (RayonArticle) ✅
- POS/Ventes : POSSupermarcheForm + POSCaissePage migrés, shield supprimé ✅
- POS/Ventes : endpoint scan code-barres corrigé (supermarcheApi.scanCodeBarres) ✅
- POS/Ventes : depotId passé via payload (pattern depot-boissons) ✅
- POS/Ventes : query keys invalidations croisées implémentées ✅
- Promotions : PromotionSupermarcheForm + PromotionsPage migrés, shield supprimé ✅
- Promotions : query keys invalidations croisées implémentées ✅
- Clients : ClientsPage.jsx migré vers useQuery + delete mutation ✅
- Clients : ClientForm.jsx query keys corrigées (dynamiques selon metier) ✅
- Clients : PAS de fields fidélité/crédit spécifiques dans schéma zod partagé (dette notée) ✅
- Fournisseurs : FournisseursPage.jsx migré vers useQuery + delete mutation ✅
- Fournisseurs : FournisseurForm.jsx query keys corrigées (dynamiques selon metier) ✅
- Réceptions : Backend PATCH endpoint ajouté avec transaction stock + MouvementStock ✅
- Réceptions : ReceptionsPage.jsx migré vers useQuery + validateMutation ✅
- Réceptions : Bouton Valider ajouté pour réceptions EN_COURS ✅
- Réceptions : Shield supprimé + invalidations croisées (receptions, articles, dashboard) ✅
- Inventaire : Backend createInventaire corrigé avec transaction + MouvementStock ✅
- Inventaire : InventaireForm.jsx migré vers useFieldArray + zod ✅
- Inventaire : InventairePage.jsx migré vers useQuery ✅
- Inventaire : Shield supprimé + invalidations croisées (inventaire, articles, dashboard) ✅
- Dépenses : DepenseForm.jsx extrait + migré vers rhf + zod ✅
- Dépenses : DepensesPage.jsx migré vers useQuery + delete mutation ✅
- Dépenses : Shield supprimé + invalidations croisées (depenses, dashboard) ✅
- Rapports : RapportsPage.jsx migré vers useQuery ✅
- Rapports : Shield supprimé ✅
- Paramètres : ParametresPage.jsx migré vers useQuery + useMutation ✅
- Paramètres : Shield supprimé ✅
- Paramètres : Backend PUT parametres Phase 4 stub vérifié ✅
- Dashboard : Backend getStats enrichi avec caJour, promosActives, alertesStock, ventesByRayon ✅
- Dashboard : Frontend DashboardSupermarche migré vers useQuery + refetchInterval: 15_000 ✅
- Dashboard : Shield supprimé + indicateur 'En direct' ajouté ✅
- Dashboard : heuresPointe reporté comme dette technique (agrégation temporelle complexe) ⚠️
- Shield cleanup global : 6 fichiers restants traités, 321 lignes supprimées ✅
- Shield cleanup global : Build réussi — aucun bug caché révélé ✅

### Dette technique détectée (NON CORRIGÉE)
**ProgrammeFidelite/CreditClient** :
- Schéma zod partagé ClientForm ne contient PAS de champs spécifiques ProgrammeFidelite/CreditClient
- Seulement `plafondCredit` générique présent
- Dette : ces champs spécifiques au supermarché ne sont pas gérés dans le formulaire partagé

**heuresPointe (Dashboard)** :
- Agrégation temporelle complexe (groupBy heure sur date) non implémentée
- Frontend affiche placeholder propre "Données non disponibles (dette technique)"
- Backend retourne heuresPointe: [] dans getStats()
- Dette à traiter séparément si requis

### Prochaine étape
Sous-module 14 — Admin (validation finale du module Supermarché)

### Règles impératives
- Un sous-module = un commit, avec build avant chaque commit
- Ne PAS toucher depot-boissons (référence stable)
- Chaque méthode backend DOIT filtrer par tenantId
- Supprimer le shield UNIQUEMENT dans les fichiers migrés dans le
  même commit — pas avant, pas après
## Sous-modules restants (ordre)
14. Admin (validation finale)