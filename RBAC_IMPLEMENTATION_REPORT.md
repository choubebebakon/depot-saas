# RAPPORT D'IMPLÉMENTATION RBAC — GesTock

> Livrable **après modification** (§25), en complément de `RBAC_AUDIT.md` (PHASE 1).
> Périmètre : `backend-depot/` (NestJS + Prisma) et `frontend-depot/` (React/Vite).
> Métiers traités de bout en bout : 🥤 Dépôt de boissons, 🛒 Supermarché, 🏪 Boutique.
> Rôles : PATRON, GERANT, CAISSIER, MAGASINIER, COMMERCIAL, COMPTABLE.

---

## 1. MÉTHODE

Chaîne cible respectée (§27) :

```text
PERMISSION ABSENTE → MODULE ABSENT DU FRONTEND → REQUÊTE API NON LANCÉE
                                          ↓ si tentative directe
                                    BACKEND REFUSE (403)
```

Aucun guard n'a été supprimé ni affaibli pour « faire disparaître » un 403.
Les 403 légitimes restent des 403 ; seuls ont été corrigés :

1. les **éléments d'UI** proposés alors que la permission manque ;
2. les **appels API** déclenchés automatiquement sans permission ;
3. les **permutations de rôles erronées** (Gérant traité comme admin tenant) ;
4. la **granularité des rapports** (§10).

---

## 2. CHANGEMENTS EFFECTUÉS

### 2.1 Backend — autorisation centralisée (source de vérité)

| Fichier | Changement | § |
|---|---|---|
| `auth/permission.service.ts` | GERANT : deny élargi de `audit_patron` **+ `abonnement` + `depots`** (`getPermission` et `denySousModules`) — Gérant = gérant d'**établissement**, pas admin tenant | §3, §4, §23 |
| `auth/permission.service.ts` | `canPerformAction` + cache d'actions (`ActionPermission`) et exposition de `actions` / `actionsFullAccess` dans `getPermissionsForUser` | §11, §14 |
| `auth/permissions.config.ts` | `ADMINISTRATION_SUBMODULES = {utilisateurs, depots, abonnement, parametres, administration}` : source unique de vérité du domaine tenant | §23 |
| `auth/permissions.config.ts` | `GERANT_DENY_SOUS_MODULES = {audit_patron, abonnement, depots}` : liste de refus du Gérant centralisée et **consommée** par `PermissionService` (`getPermission` + `denySousModules`) au lieu d'être dupliquée en dur | §3, §23 |
| `auth/rbac-matrix.spec.ts` **(nouveau)** | Matrice §21 testée sur le vrai `PermissionService` alimenté par le seed (25 tests) | §21 |
| `auth/frontend-matrix-parity.spec.ts` **(nouveau)** | **Verrou de parité** : la matrice miroir frontend (`matrix.js`) doit être strictement identique au seed backend (sous-modules, `canRead`/`canWrite`) et la liste de refus Gérant du frontend doit égaler `GERANT_DENY_SOUS_MODULES` (skip propre si le frontend est absent) | §19, §25 |
| `auth/seed-permissions.data.ts` **(nouveau)** | Matrice de référence RBAC extraite du seed (données pures, sans effet de bord) → **source unique** partagée par le seed et les tests | §11, §21 |
| `prisma/seed-permissions.ts` | Consomme `PERMISSION_SEED` ; suppression des lignes `rapports` de CAISSIER/MAGASINIER/COMMERCIAL ; **purge** de toute ligne d'administration tenant accordée à un rôle ≠ PATRON ; retrait de la ligne `['depots', true, false]` du COMPTABLE (inert mais trompeuse) | §10, §23 |
| `modules/depot-boissons/rapport-permission.util.ts` **(nouveau)** | `rapportSousModule(type)` : `stock` → `rapports_stock`, `commissions` → `rapports_performance`, tout le reste → `rapports` (fail-closed sur type inconnu) | §10 |
| `modules/depot-boissons/depot-boissons.controller.ts` | `assertRapportAccess()` (dynamique, par type de rapport) remplace le `@RequirePermission('rapports','read')` statique sur `GET rapports/:type` et l'export | §10, §15 |
| `rapports/rapports.controller.ts` | `performance-commerciaux` : `@RequirePermission('rapports_performance','read')` + COMMERCIAL autorisé (self-scope serveur) ; `top-produits-marge` : `@RequirePermission('rapports','read')` (défense en profondeur) | §10, §15 |
| `rapports/rapports.service.ts` | `getPerformanceCommerciaux` : le COMMERCIAL ne voit que **sa** ligne ; un GERANT demandant un dépôt hors de son périmètre est refusé | §3, §7, §16 |

**Rappel des garanties déjà en place (vérifiées, non contournées) :**

- `POST /depots` et `POST /:metier/depots` → `@Roles(PATRON)` : un GERANT/CAISSIER/… reçoit un **403 légitime** (§4, §17).
- `GET /depots` → liste **scopée serveur** (PATRON = tenant ; autres = dépôt principal + affectations `UserDepot`) (§16).
- `DepotScopeInterceptor` → ignore `tenantId`/`depotId` du client, résout le périmètre depuis le jeton, **fail-closed** (§6, §16, §17).
- `DepotsService` → `update` d'un Gérant limité à **son** dépôt ; archivage PATRON uniquement (§3).

### 2.2 Frontend

| Fichier | Changement | § |
|---|---|---|
| `shared/permissions/matrix.js` | Miroir exact du seed backend ; GERANT : `deny = audit_patron + abonnement + depots` ; nouvelles clés `rapports_stock` / `rapports_performance` ; suppression de la ligne `depots` du COMPTABLE | §10, §23 |
| `shared/permissions/matrix.js` | `pathToSousModule` : aliases `rapports-stock` → `rapports_stock`, `performance`/`mes-performances` → `rapports_performance`, `ventes-caisse` → `caisse` | §12 |
| `components/DynamicSidebar.jsx` | Menus Administration filtrés pour le GERANT (`utilisateurs` + `parametres` seulement → **plus de « Dépôts », plus d'« Abonnement »**) | §4, §12, §23 |
| `components/admin/DepotsPage.jsx` | `ADMIN_PERMS.GERANT` : `canView` + `canEdit` uniquement (**suppression de `canCreate` / `canDelete`**) → bouton « Nouveau Dépôt » absent | §4 |
| `pages/DepotsPage.jsx` (legacy) | Boutons conditionnés par `canCreateDepot` / `canEditDepot` / `canArchiveDepot` (PATRON/ADMIN) | §4 |
| `modules/*/sidebar.config.js` (boutique, supermarché, dépôt) | Entrées « Mes performances » (3 métiers) et « Rapports stock » (dépôt), masquées automatiquement sans permission | §10, §12 |
| `modules/*/routes.jsx` | Routes gatées par `PermissionGate` : `performance` → `rapports_performance`, `rapports-stock` → `rapports_stock`, redirections `/ventes` → `/ventes-caisse` | §14 |
| `modules/{boutique,supermarche}/pages/Dashboard*.jsx` | Widget CA/Top produits : `enabled: canReadRapports` — **plus d'appel `/rapports` pour un rôle sans permission** | §13 |
| `modules/depot-boissons/pages/RapportsPage.jsx` | Onglets filtrés par sous-module ; `useQuery.enabled` conditionné ; export bloqué si rapport non autorisé ; hooks déclarés avant les sorties anticipées | §10, §13 |
| `shared/pages/PerformancePage.jsx` **(nouveau)** | Page « Mes performances » (self-scope) partagée par les 3 métiers | §7, §9, §10 |

---

---

## 3. PERMISSIONS CRÉÉES / MODIFIÉES

### 3.1 Granularité des rapports (§10)

| Sous-module | PATRON | GERANT | CAISSIER | MAGASINIER | COMMERCIAL | COMPTABLE |
|---|---|---|---|---|---|---|
| `rapports` (financier) | ✅ code | ✅ code (scopé établissement) | ❌ | ❌ | ❌ | ✅ seed |
| `rapports_stock` | ✅ code | ✅ code | ❌ | ✅ seed | ❌ | ✅ via `rapports` |
| `rapports_performance` | ✅ code | ✅ code | ❌ | ❌ | ✅ seed | ✅ via `rapports` |

- Les lignes `rapports` de CAISSIER / MAGASINIER / COMMERCIAL sont **supprimées par le seed** (§10).
- PATRON et GERANT restent calculés **en code** (`PermissionService`), donc jamais dépendants de la table.

### 3.2 Administration tenant (§23) — séparation TENANT_ADMIN / ESTABLISHMENT_MANAGER

| Sous-module d'administration | PATRON | GERANT | CAISSIER | MAGASINIER | COMMERCIAL | COMPTABLE |
|---|---|---|---|---|---|---|
| `depots` (nouvel établissement) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `abonnement` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `audit_patron` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `utilisateurs` (employés du périmètre) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `parametres` (réglages du périmètre) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

La liste `ADMINISTRATION_SUBMODULES` est désormais la **référence unique** :
`PermissionService` refuse d'office ces sous-modules à tout rôle autre que PATRON/GERANT, le seed **les purge** de la table (il importe la constante depuis `auth/permissions.config.ts`), et deux tests d'invariant interdisent d'en accorder un à un rôle opérationnel — côté backend (`rbac-matrix.spec.ts`) comme côté frontend (parité `matrix.js` ⇄ seed).

### 3.3 Matrice opérationnelle seedée (extrait)

| Sous-module | Caissier | Magasinier | Commercial | Comptable |
|---|---|---|---|---|
| `pos_caisse` / `caisse` | ✅ opération | ❌ | ❌ | 👁️ contrôle |
| `stock` / `stock_articles` | 👁️ | ✅ écriture | 👁️ | 👁️ |
| `ventes` | ✅ écriture | 👁️ | ✅ écriture | 👁️ |
| `inventaire` | ❌ | ✅ | ❌ | 👁️ |
| `receptions` | ❌ | ✅ | ❌ | 👁️ |
| `fournisseurs` | ❌ | 👁️ (SM) | ❌ | ✅ |
| `depenses` | ❌ | ❌ | ❌ | ✅ |
| `promotions` | 👁️ | 👁️ (SM) / ❌ | ✅/❌ selon métier | 👁️/❌ |

(👁️ = lecture seule, ✅ = lecture + écriture, ❌ = absent → **masqué du frontend**.)

---

## 4. RÈGLES DE SCOPE

Le backend ne fait **jamais** confiance au client (§6, §16, §17) :

```text
1. tenant        : resource.tenantId === user.tenantId            (sinon 403/404)
2. établissement : resource.depotId ∈ { user.depotId } ∪ UserDepot(user)
                   (DepotScopeInterceptor — fail-closed, ignore les entêtes client)
3. métier        : PermissionService.resolveMetierSlug(tenant) → table Permission
4. rôle          : RolesGuard (@Roles) pour les routes sensibles
5. permission    : PermissionGuard (@RequirePermission / @RequireAction), deny-by-default
6. ressource     : self-scope (COMMERCIAL = sa ligne), dépôt demandé ∈ périmètre
```

Conséquence pour un Gérant : `GET /ventes?depotId=BOUTIQUE_A` → **200**, `GET /ventes?depotId=BOUTIQUE_B` → **403**, même si la permission `ventes.read` est accordée.

---

## 5. MODULES MASQUÉS PAR RÔLE (résultat obtenu)

| Rôle | Navigation (Boutique / Supermarché / Dépôt) | Jamais affiché |
|---|---|---|
| GERANT | Dashboard, Ventes/Caisse, Stocks, Inventaire, Clients, Catégories/Rayons, Promotions, Factures, Fournisseurs, Réception, Dépenses, Rapports, Employés, Paramètres établissement | **Nouveau dépôt**, Dépôts, Abonnement, Audit patron |
| CAISSIER | Dashboard, Ventes/Caisse(POS), Stocks 👁️, Clients, Catégories/Rayons 👁️, Promotions 👁️, Factures | Rapports, Fournisseurs, Réception, Inventaire, Dépenses, Employés, Paramètres |
| MAGASINIER | Dashboard, Stocks, Inventaire, Catégories/Rayons 👁️, Réception, Fournisseurs 👁️, **Rapports stock** | Ventes, Caisse, Clients, Promotions, Dépenses, Rapports financiers |
| COMMERCIAL | Dashboard, Ventes, Stocks 👁️, Clients, Promotions 👁️, Livraisons/Tournées (dépôt), Factures 👁️, **Mes performances** | Caisse, Inventaire, Fournisseurs, Réception, Dépenses, Rapports financiers |
| COMPTABLE | Dashboard, Ventes 👁️, Caisse 👁️ contrôle, Stocks 👁️, Clients, Factures, Fournisseurs, Réception 👁️, Inventaire 👁️, Dépenses, Rapports | Promotions (gestion), modification de stock, opérations de caisse |

Le masquage est **double** : sidebar/menus/routes (frontend) **et** refus serveur (backend).

---

## 6. ROUTES FRONTEND PROTÉGÉES

```text
/:metier/performance        → PermissionGate('rapports_performance')
/depot/rapports-stock       → PermissionGate('rapports_stock')
/depot/rapports             → PermissionGate('rapports')
/:metier/rapports           → PermissionGate('rapports')
/:metier/factures           → PermissionGate('ventes')       (defense in depth)
/:metier/receptions         → PermissionGate('receptions')
/depot/consignes, /livraisons, /tournees → gates existants conservés
```

Sans permission : la route n'est **pas proposée** ; en accès direct par URL, `PermissionGate` affiche l'écran d'accès refusé **sans déclencher d'appel API** (les `useQuery` sont `enabled: false`).

---

## 7. ENDPOINTS BACKEND PROTÉGÉS (extrait)

| Endpoint | Garde | Permission / scope |
|---|---|---|
| `POST /depots`, `POST /:metier/depots` | `@Roles(PATRON)` + `DepotsService.requirePatron` | ❌ GERANT/CAISSIER/… (§4, §17) |
| `PATCH /depots/:id` | `DepotsService` | GERANT : **son** dépôt uniquement |
| `DELETE /depots/:id` | `DepotsService` | PATRON uniquement |
| `GET /depots` | `DepotScopeInterceptor` | liste scopée serveur (§16) |
| `GET /:metier/utilisateurs` | `@RequirePermission('utilisateurs', …)` | administration tenant |
| `GET /:metier/rapports` | `@RequirePermission('rapports','read')` | financier |
| `GET /depot-boissons/rapports/:type` | `assertRapportAccess(type)` | dynamique : `rapports` / `rapports_stock` / `rapports_performance` |
| `GET /depot-boissons/rapports/:type/export` | idem + permission de lecture | export PDF/CSV |
| `GET /rapports/performance-commerciaux` | `@Roles(…COMMERCIAL)` + `@RequirePermission('rapports_performance','read')` | self-scope COMMERCIAL |
| `GET /rapports/top-produits-marge` | `@RequirePermission('rapports','read')` | financier |
| `GET /:metier/pos_caisse*`, `/caisse*` | `@RequirePermission(<caisse>, …)` | ❌ MAGASINIER / COMMERCIAL |
| `PATCH /*/stock/*`, `POST /*/stock/ajuster` | `@RequirePermission(stock, 'write')` | ❌ CAISSIER / COMMERCIAL / COMPTABLE |
| Actions fines (annuler une vente, ouvrir/fermer la caisse) | `@RequireAction('ventes.annuler', 'caisse.fermer'…)` | table `ActionPermission` |

Un appel non autorisé renvoie proprement **403 Forbidden** avec `{ error: 'ACCESS_DENIED', message }` — l'utilisateur normal ne le rencontre plus car l'interface ne propose plus l'action.

---

## 8. CORRECTIONS DES 403

| # | Endpoint | Rôle | Cause initiale | Traitement |
|---|---|---|---|---|
| 1 | `POST /depots` | GERANT | bouton « Nouveau Dépôt » affiché | Bouton **supprimé** (2 pages) ; 403 backend conservé (légitime) |
| 2 | `GET /abonnement` | GERANT | menu Abonnement affiché | Menu **retiré** (sidebar + deny `abonnement`) ; 403 conservé |
| 3 | `GET /:metier/rapports` (dashboard) | rôles sans `rapports.read` | widget CA appelé inconditionnellement | `enabled: canReadRapports` → **aucun appel** ; 403 conservé |
| 4 | `GET /depot-boissons/rapports/:type` | MAGASINIER / COMMERCIAL | contrôle en dur sur `rapports` | **Granularité** `rapports_stock` / `rapports_performance` (backend + frontend) |
| 5 | `GET /rapports/performance-commerciaux` | COMMERCIAL | `@Roles` sans COMMERCIAL | Ouvert au COMMERCIAL avec `rapports_performance` + **self-scope** |
| 6 | `GET /depots` (contexte) | GERANT | perception d'un accès « tous dépôts » | Liste **scopée serveur** + bascule refusée hors périmètre (déjà en place, désormais testée) |

Aucun guard supprimé : **aucun 403 légitime transformé en 200**.

---

## 9. TESTS AJOUTÉS

### Backend

| Fichier | Contenu |
|---|---|
| `src/auth/rbac-matrix.spec.ts` **(nouveau)** | **25 tests** de la matrice §21 exécutés sur le vrai `PermissionService` alimenté par `seed-permissions.data.ts` : création d'établissement (PATRON ✅ / GERANT + 4 rôles opérationnels ❌ × 3 métiers), administration tenant, rapports granulaires (Caissier ❌ / Magasinier « stock » only / Commercial « performances » only / Comptable + Gérant ✅), stock (seul MAGASINIER en écriture ; Gérant/Patron ✅), caisse (Caissier + Gérant opèrent ; Magasinier/Commercial ❌ ; Comptable lecture seule) + invariants de matrice (doublons, dashboard, aucune permission d'admin tenant, périmètre des rôles/métiers) |
| `src/auth/frontend-matrix-parity.spec.ts` **(nouveau)** | **3 tests** de parité frontend ⇄ backend : mêmes sous-modules, mêmes `canRead`/`canWrite`, même liste de refus Gérant — garantit qu'aucun module interdit ne peut réapparaître dans la sidebar (skip propre sans dépôt frontend) |
| `src/auth/permission.service.spec.ts` | GERANT refusé sur `abonnement` **et** `depots` ; `denySousModules` incluant `depots` ; granularité des rapports par rôle |
| `src/auth/seed-permissions.data.ts` | Matrice partagée seed ⇄ tests (source unique de vérité) |
| `src/depots/depots.service.spec.ts` | Isolation : Gérant → **son** dépôt ✅ ; autre dépôt ❌ (lecture, modification, archivage) ; création réservée PATRON |
| `src/common/interceptors/depot-scope.interceptor.spec.ts` | Isolation établissement/tenant, refus d'un dépôt sans affectation, dépôt archivé, sources incohérentes |
| `src/modules/depot-boissons/rapport-permission.util.spec.ts` | Mapping type → sous-module (`stock` → `rapports_stock`, `commissions` → `rapports_performance`, fail-closed sur type inconnu) |
| `src/rapports/rapports.service.spec.ts` | Self-scope COMMERCIAL, Gérant verrouillé sur son dépôt, refus hors périmètre |

### Frontend

- Matrice miroir `shared/permissions/matrix.js` alignée sur le seed (mêmes clés, même deny Gérant).
- ESLint sans erreur sur tous les fichiers RBAC modifiés — un vrai `react-hooks/rules-of-hooks` a été détecté **et corrigé** dans `RapportsPage.jsx`.

---

## 10. TESTS EXÉCUTÉS

```text
Backend  : npx jest --runInBand   →  26 suites / 275 tests   ✅ 100 % PASS
           dont les 7 suites RBAC (§21) : 75 tests (25 + 3 + 17 + 12 + 9 + 5 + 4)
           npx tsc --noEmit       →  aucune erreur sur les fichiers RBAC
                                     (seule erreur restante : meta-graph-api.service.spec.ts,
                                      préexistante et hors périmètre)
Frontend : npm run build          →  ✅ exit 0
           npx eslint <RBAC files>→  0 erreur (warnings préexistants : variables non utilisées)
             · dont 1 vrai `react-hooks/rules-of-hooks` détecté puis corrigé (RapportsPage.jsx)
             · RapportsPage.jsx : 0 erreur ET 0 warning après correction
             · parité frontend ⇄ backend : 3/3 tests verts (matrix.js == seed-permissions.data.ts)
```

Détail des suites RBAC (nouvelles ou renforcées) :

| Suite | Tests | Statut |
|---|---|---|
| `auth/rbac-matrix.spec.ts` | 25 | ✅ |
| `auth/frontend-matrix-parity.spec.ts` | 3 | ✅ (non skippée : dépôt frontend présent) |
| `auth/permission.service.spec.ts` | 17 | ✅ |
| `depots/depots.service.spec.ts` | 12 | ✅ |
| `common/interceptors/depot-scope.interceptor.spec.ts` | 9 | ✅ |
| `modules/depot-boissons/rapport-permission.util.spec.ts` | 5 | ✅ |
| `rapports/rapports.service.spec.ts` | 4 | ✅ |


---

## 11. MIGRATIONS

**Aucune migration Prisma n'est requise** (aucun changement de schéma) :

1. `prisma/seed-permissions.ts` est **idempotent** (`upsert`) → exécutable en production sans risque.
2. Il effectue deux **nettoyages de données** non destructifs :
   - suppression des lignes `rapports` de CAISSIER / MAGASINIER / COMMERCIAL (remplacées par `rapports_stock` / `rapports_performance`) ;
   - suppression de toute ligne d'administration tenant (`depots`, `abonnement`, `utilisateurs`, `parametres`, `administration`) accordée à un rôle ≠ PATRON.
3. Ces suppressions sont des **no-op fonctionnels** : `PermissionService` refusait déjà ces sous-modules en code. Aucune donnée métier (ventes, stock, clients, factures…) n'est touchée.
4. Ordre d'exécution recommandé : `npx prisma migrate deploy` (inchangé) puis `npx ts-node prisma/seed-permissions.ts`.

---

## 12. LIMITATIONS RESTANTES

| Sujet | État | Justification |
|---|---|---|
| « Rapports stock » Supermarché / Boutique | Menu + route gatés par `rapports_stock`, mais **pas d'endpoint de rapport stock dédié** : le MAGASINIER conserve sa page Stocks (sans données financières) | Éviter de créer une API métier non spécifiée (§20 : ne pas casser l'existant) |
| 14 métiers non prioritaires (pharmacie, restaurant…) | Conservent la matrice legacy `utils/rbac.js` (`FINANCE_WRITE` inclut CAISSIER) | Hors périmètre des 3 métiers prioritaires ; itération dédiée à prévoir |
| Pages legacy racine (`MainLayout`, `pages/DepotsPage.jsx`, `components/admin/*`) | Boutons conditionnés par rôle mais reposant sur `ADMIN_PERMS` local | Refactor complet vers `usePermission` recommandé (non bloquant : le backend refuse déjà) |
| `/depot/achats` (`AchatAccess`) | Contrôle par rôles en dur au lieu du sous-module `receptions` | Menu déjà masqué par le filtre de sidebar ; à migrer vers `PermissionGate` |
| Permissions d'**action** fines | Exposées au frontend (`actions`, `actionsFullAccess`) et consommées par `useActions` ; couverture d'écrans partielle | Le backend reste seul juge via `canPerformAction` |
| `audit_patron` | Interdit au GERANT côté permission ; l'audit reste consultable par le PATRON | Conforme §3 / §23 |

---

## 13. CONCLUSION

```text
PERMISSION ABSENTE → MODULE ABSENT (sidebar, menus, routes, boutons, dashboards)
                   → REQUÊTE API NON LANCÉE (enabled: false)
                   → TENTATIVE DIRECTE → 403 BACKEND (ACCESS_DENIED)

PERMISSION PRÉSENTE + BON TENANT + BON MÉTIER + BON ÉTABLISSEMENT + BON SCOPE
                   → ACCÈS AUTORISÉ
```

- Le **GERANT** n'a plus « Nouveau dépôt », ne voit plus Abonnement ni Audit patron, et reste strictement limité à **son** établissement (liste scopée serveur + `DepotScopeInterceptor` + `DepotsService`).
- Les **rapports** sont granulaires (`rapports`, `rapports_stock`, `rapports_performance`) et alignés frontend ⇄ backend sur une **source unique de vérité** (`seed-permissions.data.ts` / `matrix.js`).
- Aucun guard n'a été contourné : tous les 403 légitimes subsistent ; seules les causes architecturales et les éléments d'UI / appels API illégitimes ont été corrigés.
