# État de la migration GeStock — Contexte pour reprise

## Méthode en cours
Migration progressive de chaque module métier vers le pattern :
react-hook-form + zod + react-query (useSectorQuery) + suppression
du "Shield Runtime" (code mort défensif ~54 lignes/fichier).

## Module de référence (100% terminé, NE PAS TOUCHER)
`frontend-depot/src/modules/depot-boissons/` — pattern à dupliquer
tel quel pour les autres secteurs.

## Module en cours : Boutique
Dernier commit : dc52aab "feat(boutique): add CRUD endpoints — articles, stock, clients, fournisseurs, depenses, personnel"

### Terminé (sous-modules 0, 1)
- Infrastructure : boutiqueApi.js créé (modèle supermarcheApi.js) ✅
- Backend socle : CRUD Articles, Stock, Clients, Fournisseurs, Dépenses, Personnel ✅
- Backend socle : 26 endpoints créés + 2 existants mis à jour ✅
- Backend socle : Tous les endpoints filtrent par tenantId ✅
- Backend socle : NotFoundException sur lookups par id ✅

### Dette technique détectée (NON CORRIGÉE)
**COMMERCIAL vs VENDEUR** :
- Le modèle `User` utilise l'enum `Role` avec valeur `COMMERCIAL`
- Le fichier `permissions.js` de Boutique utilise `VENDEUR` au lieu de `COMMERCIAL`
- Dette : Incohérence de nommage entre l'enum Prisma et les permissions frontend
- Impact : Le filtre par rôle dans PersonnelService fonctionnera avec `COMMERCIAL`, mais le frontend attend `VENDEUR`
- Correction requise : Mapper `VENDEUR` → `COMMERCIAL` dans le frontend ou mettre à jour l'enum Prisma

### Prochaine étape
Sous-module 2 — Stock/Articles (frontend migration)

### Règles impératives
- Un sous-module = un commit, avec build avant chaque commit
- Ne PAS toucher depot-boissons (référence stable)
- Chaque méthode backend DOIT filtrer par tenantId
- Supprimer le shield UNIQUEMENT dans les fichiers migrés dans le
  même commit — pas avant, pas après

## Sous-modules restants (ordre)
2. Stock/Articles
3. Ventes/Caisse
4. Promotions
5. Clients
6. Fournisseurs
7. Personnel

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