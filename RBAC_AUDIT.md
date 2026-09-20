# AUDIT RBAC — GesTock (3 métiers prioritaires : Dépôt de boissons, Supermarché, Boutique)

> Audit réalisé en PHASE 1 (lecture seule, aucune modification au moment de sa rédaction).
> Périmètre : `backend-depot/` (NestJS + Prisma) et `frontend-depot/` (React/Vite).

---

## 1. ARCHITECTURE ACTUELLE

### 1.1 Backend (source de vérité)

Chaîne d'autorisation globale (`src/app.module.ts`), dans l'ordre :

```
ThrottlerGuard → JwtAuthGuard → AccessStatusGuard (abonnement) → RolesGuard → PermissionGuard
puis intercepteurs : DepotScopeInterceptor → ClientDepotScope → ClientCreditSafety → AuditSafety → PromotionScope → TourneeScope → RealtimeMutation
```

| Brique | Fichier | Rôle |
|---|---|---|
| `RolesGuard` | `auth/guards/roles.guard.ts` | `@Roles(RoleUser.*)` grossier (rôles déclarés) |
| `PermissionGuard` | `auth/guards/permission.guard.ts` | `@RequirePermission(sousModule, read/write)` + `@RequireAction(action)` — deny-by-default |
| `PermissionService` | `auth/permission.service.ts` | Table `Permission` (role×métier×sous-module, canRead/canWrite) + table `ActionPermission` (actions fines). PATRON/GERANT gérés en code |
| `DepotScopeInterceptor` | `common/interceptors/depot-scope.interceptor.ts` | Résout le périmètre établissement par requête (ALS `req.depotScope`) : tenant vérifié, dépôt demandé ∈ {`user.depotId` ∪ affectations `UserDepot`} pour les non-PATRON, fail-closed |
| `DepotsService` | `depots/depots.service.ts` | `POST /depots` réservé PATRON (`@Roles(PATRON)` + `requirePatron`), `findAll` scopé serveur (`getAllowedDepotIds`), `update` GERANT limité à `user.depotId`, archivage PATRON only |
| Seed permissions | `prisma/seed-permissions.ts` | Matrice role×métier×sous-module (deny-by-default) |
| Seed actions | `prisma/seed-actions.ts` | Matrice role×métier×action (caisse.fermer, stock.ajuster…) |
| `/auth/permissions` | `auth/auth.controller.ts` | Carte des sous-modules + actions fines + `denySousModules` pour le frontend |

Modèles Prisma pertinents : `User` (role, tenantId, depotId), `UserDepot` (affectations multi-établissements §13), `Permission`, `ActionPermission`, `Depot`, `Tenant` (metier, plan).

**Points forts confirmés :**
- `POST /depots` et `POST /:metier/depots` → `@Roles(PATRON)` uniquement : le backend **refuse déjà** la création d'établissement par un GERANT/CAISSIER/… (403 légitime). ✔ §4 backend
- `GET /depots` renvoie uniquement le périmètre autorisé (PATRON = tenant, autres = depot principal + `UserDepot`). ✔ §16
- `DepotScopeInterceptor` ignore les `tenantId/depotId` envoyés par le client et détermine le scope serveur ; refus `403` hors périmètre. ✔ §6/§16/§17
- `GET /rapports` des 3 modules métiers : `@RequirePermission('rapports','read')` → piloté par la table `Permission`. ✔ §15
- Frontend : sidebar dynamique filtrée par `resolvePermission` (miroir du seed) pour les 3 métiers granulaires ; `PermissionGate` sur chaque route ; `usePermission`/`useActions` pour les boutons.

### 1.2 Frontend

- `DynamicSidebar.jsx` : menus métiers filtrés par `canRead` (métiers granulaires uniquement), bloc administration séparé.
- `shared/permissions/matrix.js` : miroir du seed (`PERMISSION_MATRIX`), `resolvePermission` (PATRON/GERANT en code), `pathToSousModule` (chemin → sous-module).
- `shared/hooks/usePermission.js` : double API (granulaire + legacy).
- `contexts/DepotContext.jsx` : liste `/depots` scopée serveur, bascule interdite hors périmètre.

---

## 2. PROBLÈMES DÉTECTÉS

### P0-1 — « Nouveau Dépôt » visible pour le GÉRANT (viol §4, §23)
`frontend-depot/src/components/admin/DepotsPage.jsx` ligne 10 :
```js
const ADMIN_PERMS = { PATRON: {…'all'}, GERANT: { canCreate: ['depots'], canEdit: ['depots'], canDelete: ['depots'] } };
```
Le Gérant reçoit `canCreate`/`canDelete` sur les dépôts → le bouton **« + Nouveau Dépôt »** est rendu (`{perm.canCreate && <button>…`), le clic provoque un **403 légitime du backend** (`@Roles(PATRON)`). C'est exactement le scénario interdit par la mission : UI montre un module/bouton interdit.
Le backend est correct ; c'est l'UI qui est en tort (matrice legacy jamais alignée).

### P0-2 — Menus d'administration affichés au GÉRANT sans filtrage (viol §1, §3, §23)
`DynamicSidebar.jsx` : `ADMIN_ROLES = ["PATRON", "GERANT", "ADMIN", "PHARMACIEN"]` → le bloc statique `ADMIN_MENUS` (**Utilisateurs, Dépôts, Paramètres, Abonnement**) est rendu **sans filtre de permission** pour le Gérant.
Or le backend refuse à GERANT : `abonnement` (403), et l'écran Dépôts expose à nouveau « Nouveau Dépôt » (P0-1). Seuls Utilisateurs (Employés) et Paramètres sont légitimes (matrice §7 : Employés ✅, Paramètres établissement ✅, Abonnement ❌, Administration tenant ❌).

### P0-3 — Incohérence backend/frontend sur les refus GERANT
- Backend `PermissionService` : GERANT → deny `audit_patron` + `abonnement` ; `denySousModules=['audit_patron','abonnement']` dans `/auth/permissions`.
- Frontend `matrix.js::resolvePermission` (fallback hors API) : GERANT → deny **uniquement** `audit_patron` → il considère `abonnement` comme autorisé. Divergence = source de 403 « incohérents » si l'API permissions n'est pas chargée.

### P1-1 — Rapports monolithiques (viol §10)
La table `Permission` n'a qu'un sous-module `rapports`. Le seed accorde `rapports.canRead=true` à **CAISSIER, MAGASINIER, COMMERCIAL** sur les 3 métiers :
- CAISSIER voit le menu « Rapports » alors que toutes les matrices cibles l'interdisent (`reports.* → ❌`) ;
- MAGASINIER voit les rapports financiers alors qu'il ne doit avoir que « Rapports stock » ;
- COMMERCIAL voit les rapports financiers alors qu'il ne doit avoir que « Mes performances » (et l'endpoint `/rapports/performance-commerciaux` est actuellement interdit aux COMMERCIAL par `@Roles(PATRON,GERANT,COMPTABLE)`).

### P1-2 — Dashboards : appels API interdits pour les rôles sans permission (viol §13)
`DashboardBoutique.jsx` et `DashboardSupermarche.jsx` appellent `/{metier}/rapports` (widget chiffre d'affaires) **pour tout utilisateur**, y compris CAISSIER (sans `rapports.canRead` après correction P1-1) → 403 automatiques au chargement du dashboard. Les requêtes doivent être conditionnées (`enabled: canReadRapports`).

### P1-3 — Page Rapports Dépôt : contrôle par rôle codé en dur
`modules/depot-boissons/pages/RapportsPage.jsx` : `const canRead = role === 'PATRON' || role === 'GERANT' || role === 'COMPTABLE'` (ignore `usePermission` et la table), et affiche les 6 onglets de rapports (dont dépenses/clients débiteurs = financier) à quiconque passe le contrôle de rôle, sans granularité par onglet.

### P2 (documentés, non corrigés — prudence)
- `auth/roles.config.ts` (`RolePermissions`, GERANT=ALL) : modèle grossier legacy, sans usages détectés dans les guards actifs — à retirer dans une passe ultérieure.
- `DepotsService.update` : le GERANT n'est autorisé que sur `user.depotId` (pas les affectations `UserDepot`) — incohérence mineure avec `getAllowedDepotIds` (§13), acceptable pour l'instant.
- `AchatsAccess` (route `/depot/achats`) : contrôle par rôles en dur au lieu du sous-module `receptions` — le menu est masqué par le filtre de sidebar pour les rôles non autorisés ; risque faible.
- Matrice legacy `utils/rbac.js` (FINANCE_WRITE incluant CAISSIER) : utilisée uniquement par les 14 métiers non granulaires hors périmètre.

---

## 3. SOURCES DES 403 ACTUELS

| # | Endpoint | Rôle | Cause | Verdict |
|---|---|---|---|---|
| 1 | `POST /depots` | GERANT | bouton « Nouveau Dépôt » affiché (P0-1) | 403 légitime, UI fautive |
| 2 | `GET /abonnement` (module) | GERANT | menu Abonnement affiché (P0-2) | 403 légitime, UI fautive |
| 3 | `GET /boutique/rapports`, `GET /supermarche/rapports` | rôles sans `rapports.read` (via dashboard) | widget CA non conditionné (P1-2) | 403 légitime, appel illégitime |
| 4 | `GET /depot-boissons/rapports/:type` | roles selon table | contrôle page en dur + granularité absente (P1-1/P1-3) | à granulariser |
| 5 | `/rapports/performance-commerciaux` | COMMERCIAL | `@Roles` sans COMMERCIAL (P1-1) | 403 à corriger (self-scope) |

Aucun guard ne sera supprimé : les 403 légitimes restent légitimes ; ce sont les **appels et éléments d'UI fautifs** qui sont corrigés.

---

## 4. PLAN DE CORRECTION

**Backend (source de vérité)**
1. `PermissionService` : GERANT deny = `audit_patron` + `abonnement` + `depots` (getPermission + denySousModules). (Aucun endpoint n'utilise `@RequirePermission('depots')` → zéro régression.)
2. Seed `seed-permissions.ts` : remplacer les lignes `rapports` de CAISSIER/MAGASINIER/COMMERCIAL par la granularité §10 :
   - MAGASINIER : `rapports_stock` (read) ;
   - COMMERCIAL : `rapports_performance` (read) ;
   - CAISSIER : rien (deny par défaut).
3. `depot-boissons.controller::getRapport` : sous-module dépendant du `type` (`stock`→`rapports_stock`, `commissions`→`rapports_performance`, sinon `rapports`), via `PermissionService.canAccess`.
4. `rapports.controller` : `performance-commerciaux` ouvert au COMMERCIAL avec `@RequirePermission('rapports_performance','read')` + self-scope serveur (le COMMERCIAL ne voit que sa ligne) ; `top-produits-marge`/`point-mort` : ajout `@RequirePermission('rapports','read')` (défense en profondeur).

**Frontend**
5. `matrix.js` : GERANT deny `audit_patron`+`abonnement`+`depots` ; miroir de la nouvelle matrice ; alias `rapports-stock`→`rapports_stock`, `performance`→`rapports_performance`.
6. `DynamicSidebar.jsx` : filtrer `ADMIN_MENUS` pour le GERANT (Utilisateurs + Paramètres uniquement).
7. `components/admin/DepotsPage.jsx` : GERANT = vue (+édition de son dépôt), sans create/delete.
8. `pages/DepotsPage.jsx` (legacy) : boutons conditionnés au rôle.
9. Dashboards boutique/supermarché : requêtes rapports conditionnées par `canRead('rapports')`.
10. `RapportsPage` dépôt : onglets + requêtes filtrés par permission, preset par route.
11. Sidebar/route « Mes performances » (3 métiers) et « Rapports stock » (dépôt) ; gate par les nouveaux sous-modules.

**Tests**
- `permission.service.spec.ts` : GERANT (abonnement/depots refusés, ventes autorisés), COMMERCIAL (rapports ❌ / rapports_performance ✅), CAISSIER rapports ❌.
- `depots.service.spec.ts` : création réservée PATRON.
- `depot-scope.interceptor.spec.ts` : isolation établissement GERANT.

**Limitations documentées**
- « Rapports stock » pour Supermarché/Boutique : pas d'endpoint de rapport stock dédié côté backend ; le MAGASINIER conserve sa page Stocks (données complètes, sans financier). La création d'un endpoint dédié est reportée pour éviter tout risque de régression — le module Dépôt (prioritaire) est granularisé de bout en bout.
- Le dashboard CAISSIER continue d'appeler `/dashboard` (autorisé à tous) — conforme.

---

## 5. ADDENDUM — INCOHÉRENCES DÉTECTÉES EN PHASE 6/7 (VALIDATION)

Ces deux points n'étaient pas visibles en PHASE 1 (lecture des fichiers RBAC seuls) ; ils ont été
révélés par les tests de parité/lint et sont documentés ici conformément au §27.

### A-1 — Autorisations d'administration tenant « inertes » dans le seed et la matrice miroir
- `prisma/seed-permissions.ts` contenait `['depots', true, false]` dans le bloc **COMPTABLE / supermarche**,
  et `frontend-depot/src/shared/permissions/matrix.js` la même ligne `depots: { canRead: true, canWrite: false }`.
- Impact réel : **aucun** (ces deux implémentations calculaient `depots` en code → refus pour tout rôle ≠
  PATRON/GERANT, via `ADMINISTRATION_SUBMODULES` / `GERANT_DENY_SOUS_MODULES`), mais la ligne était
  **trompeuse** : elle suggérait au lecteur (et à tout futur code lisant la table `Permission` directement,
  sans passer par `PermissionService`) qu'un COMPTABLE pouvait administrer les établissements. C'est
  exactement la faille « autorisation d'administration tenant fantôme » visée par le §23.
- Traitement : suppression de la ligne dans le seed **et** dans la matrice frontend, purge défensive par le
  seed (`deleteMany` sur les sous-modules d'`ADMINISTRATION_SUBMODULES` pour tout rôle ≠ PATRON), et deux
  tests d'invariant interdisant désormais toute réapparition (`rbac-matrix.spec.ts` + parité frontend).

### A-2 — Bug React réel dans `RapportsPage.jsx` (dépôt)
- `const numericTotals = useMemo(...)` était déclaré **après** des sorties anticipées (`if (metier !== …) return`,
  `if (!canRead) return`), donc appelé de façon conditionnelle → violation `react-hooks/rules-of-hooks`
  (détectée par ESLint, erreur bloquante en build strict) : ordre de hooks instable entre rendus dès que la
  permission ou le métier change en cours de session.
- Traitement : hooks (`rowsFlat`, `numericTotals`) remontés **avant** les sorties anticipées, mémoïsation
  conservée. Aucun changement fonctionnel, ESLint repasse à 0 erreur.

