# RAPPORT D'AUDIT RBAC — GesTock SaaS

**Date :** 2026-09-21  
**Version :** 1.0  
**Auteur :** Audit automatisé + analyse manuelle  
**Périmètre :** 3 métiers actifs — Supermarché, Boutique, Dépôt de boissons

---

## 1. ARCHITECTURE ACTUELLE DU SYSTÈME RBAC

### 1.1 Modèles de données (Prisma)

| Modèle | Rôle |
|--------|------|
| `Permission` | `role × metier × sousModule → canRead / canWrite` (unique) |
| `ActionPermission` | `role × metier × action → allowed` (deny-by-default) |
| `User` | `tenantId`, `depotId` (établissement par défaut), `role` |
| `UserDepot` | Many-to-many user ↔ établissement (multi-sites) |
| `Depot` | Établissement avec `tenantId` |

### 1.2 Guards Backend (NestJS)

| Guard | Responsabilité |
|-------|----------------|
| `JwtAuthGuard` | Validation JWT |
| `MetierGuard` | Vérifie `tenant.metier === metier requis` |
| `PermissionGuard` | Vérifie permissions `role × metier × sousModule` (read/write) + actions fines |
| `RolesGuard` | Vérification simple de rôle |

### 1.3 PermissionService (Cœur RBAC)

Méthodes clés :
- `getPermission(role, metier, sousModule)` → `{ canRead, canWrite }`
- `canAccess(role, metier, sousModule, action)` → `{ allowed }`
- `canPerformAction(role, metier, action)` → `boolean` (fine-grained, deny-by-default)
- `getPermissionsForUser(role, metier)` → carte complète pour frontend

**Logique spéciale :**
- `PATRON` → accès total (code)
- `GERANT` → accès total **SAUF** `audit_patron`, `abonnement`, `depots` (code §3/§23)
- Autres rôles → lookup en base `Permission` + `ActionPermission`

### 1.4 Matrice de Permissions (Seed)

Source unique : `src/auth/seed-permissions.data.ts` + `prisma/seed-actions.ts`

**Rôles opérationnels définis :** CAISSIER, MAGASINIER, COMMERCIAL, COMPTABLE  
**Rôles admin :** PATRON, GERANT (calculés en code)

---

## 2. ÉCARTS PAR RAPPORT AUX MATRICES DE RÉFÉRENCE

### 2.1 Supermarché — Matrice de référence vs Actuel

| Module | Référence (Caissier) | Actuel (Seed) | Écart |
|--------|---------------------|---------------|-------|
| Rapports | ❌ | ❌ (aucune ligne `rapports`) | ✅ OK |
| Fournisseurs | ❌ | ❌ | ✅ OK |
| Réception | ❌ | `receptions: read=true` ❌ | **ÉCART** — Caissier a read sur receptions |
| Inventaire | ❌ | `inventaire` absent | ✅ OK |
| Dépenses | ❌ | `depenses` absent | ✅ OK |

| Module | Référence (Magasinier/Rayonniste) | Actuel (Seed) | Écart |
|--------|----------------------------------|---------------|-------|
| Rapports financiers | ❌ | `rapports_stock` seulement | ✅ OK |
| Promotions | ❌ | `promotions: read=true` ❌ | **ÉCART** — Magasinier a read sur promotions |
| Clients | ❌ | `clients` absent | ✅ OK |
| Caisse | ❌ | `pos_caisse` absent | ✅ OK |

| Module | Référence (Commercial) | Actuel (Seed) | Écart |
|--------|----------------------|---------------|-------|
| Caisse | ❌ | ❌ | ✅ OK |
| Inventaire | ❌ | ❌ | ✅ OK |
| Fournisseurs | ❌ | ❌ | ✅ OK |
| Réception | ❌ | ❌ | ✅ OK |
| Dépenses | ❌ | ❌ | ✅ OK |
| Rapports financiers | ❌ | ❌ | ✅ OK |
| Mes performances | ✅ `rapports_performance` | ✅ | OK |

| Module | Référence (Comptable) | Actuel (Seed) | Écart |
|--------|---------------------|---------------|-------|
| Promotions | ❌ | `promotions: read=false` | ✅ OK |
| Modification stock | ❌ | `stock: write=false` | ✅ OK |
| Gestion caisse op. | ❌ | `pos_caisse: write=false` | ✅ OK |

### 2.2 Boutique — Matrice de référence vs Actuel

| Module | Référence (Caissier) | Actuel (Seed) | Écart |
|--------|---------------------|---------------|-------|
| Rapports | ❌ | ❌ (aucune ligne) | ✅ OK |
| Fournisseurs | ❌ | ❌ | ✅ OK |
| Réception | ❌ | ❌ | ✅ OK |
| Inventaire | ❌ | ❌ | ✅ OK |
| Dépenses | ❌ | ❌ | ✅ OK |
| Employés | ❌ | `utilisateurs` absent | ✅ OK |
| Paramètres | ❌ | `parametres` absent | ✅ OK |

| Module | Référence (Magasinier/Vendeur) | Actuel (Seed) | Écart |
|--------|-------------------------------|---------------|-------|
| Rapports stock | ✅ `rapports_stock` | ✅ | OK |
| Clients | ❌ | `clients: read=true` ❌ | **ÉCART** — Magasinier a read sur clients |
| Caisse | ❌ | `caisse` absent | ✅ OK |
| Promotions | ❌ | `promotions` absent | ✅ OK |
| Dépenses | ❌ | `depenses` absent | ✅ OK |

| Module | Référence (Commercial) | Actuel (Seed) | Écart |
|--------|----------------------|---------------|-------|
| Caisse | ❌ | ❌ | ✅ OK |
| Inventaire | ❌ | ❌ | ✅ OK |
| Fournisseurs | ❌ | ❌ | ✅ OK |
| Réception | ❌ | ❌ | ✅ OK |
| Dépenses | ❌ | ❌ | ✅ OK |
| Rapports financiers | ❌ | ❌ | ✅ OK |
| Mes performances | ✅ `rapports_performance` | ✅ | OK |

| Module | Référence (Comptable) | Actuel (Seed) | Écart |
|--------|---------------------|---------------|-------|
| Promotions | ❌ | `promotions: read=false` | ✅ OK |
| Modification stock | ❌ | `stock: write=false` | ✅ OK |
| Gestion caisse | ❌ | `caisse: write=false` | ✅ OK |

### 2.3 Dépôt de Boissons — Matrice de référence vs Actuel

| Module | Référence (Caissier) | Actuel (Seed) | Écart |
|--------|---------------------|---------------|-------|
| Rapports | ❌ | ❌ (aucune ligne) | ✅ OK |
| Fournisseurs | ❌ | ❌ | ✅ OK |
| Réception | ❌ | `fournisseurs: read=true` ❌ | **ÉCART** — Caissier a read sur fournisseurs |
| Inventaire | ❌ | ❌ | ✅ OK |
| Dépenses | ❌ | ❌ | ✅ OK |
| Tournée | ❌ | `tournees` absent | ✅ OK |
| Gestion livraison | ❌ | `livraisons` absent | ✅ OK |

| Module | Référence (Magasinier) | Actuel (Seed) | Écart |
|--------|----------------------|---------------|-------|
| Rapports stock | ✅ `rapports_stock` | ✅ | OK |
| Tournée | ✅ (limité préparation/logistique) | `tournees: read+write=true` | **ÉCART** — Accès complet au lieu de limité |

| Module | Référence (Commercial) | Actuel (Seed) | Écart |
|--------|----------------------|---------------|-------|
| Caisse | ❌ | ❌ | ✅ OK |
| Inventaire | ❌ | ❌ | ✅ OK |
| Fournisseurs | ❌ | ❌ | ✅ OK |
| Réception | ❌ | ❌ | ✅ OK |
| Dépenses | ❌ | ❌ | ✅ OK |
| Rapports financiers | ❌ | ❌ | ✅ OK |
| Mes performances | ✅ `rapports_performance` | ✅ | OK |

| Module | Référence (Comptable) | Actuel (Seed) | Écart |
|--------|---------------------|---------------|-------|
| Promotions | ❌ | `promotions` absent | ✅ OK |
| Modification stock | ❌ | `stock_articles: write=false` | ✅ OK |
| Gestion caisse | ❌ | `caisse: write=false` | ✅ OK |

---

## 3. PROBLÈMES ARCHITECTURAUX CRITIQUES

### 3.1 Absence d'Isolation Établissement pour GERANT (CRITIQUE)

**Problème :** Le GERANT n'est pas scopé à son établissement assigné.

**Preuve :**
- `PermissionService.getPermission()` : GERANT = full access (sauf 3 sous-modules admin)
- `getPermissionsForUser()` : `fullAccess: true`, `denySousModules: GERANT_DENY_SOUS_MODULES`
- Contrôleurs : lisent `depotId` depuis header `x-depot-id` ou query param — **aucune vérification** que le GERANT appartient à ce `depotId`
- `UserDepot` existe mais **jamais utilisé** pour filtrer les accès GERANT

**Impact :** Un GERANT de "Boutique A" peut accéder aux données de "Boutique B" en changeant le header `X-Depot-Id`.

### 3.2 Bouton "Nouveau dépôt" Accessible au GERANT

**Backend :** Aucun contrôle dans les contrôleurs — `POST /depots` ou équivalent non protégé pour GERANT  
**Frontend :** `DynamicSidebar.jsx` ligne 92-100 filtre admin menus pour GERANT → garde `utilisateurs` et `parametres` mais **pas de protection sur la création de dépôt**

### 3.3 Permissions Rapports Pas Assez Granulaires

Actuel : `rapports` (monolithique), `rapports_stock`, `rapports_performance`  
Requis : `reports.sales.read`, `reports.stock.read`, `reports.financial.read`, `reports.performance.read`

### 3.4 Appels API Frontend Inutiles

- Dashboards peuvent appeler des endpoints pour modules sans permission
- Ex: CASSIER dashboard → pas d'appel `/reports` mais code à vérifier

### 3.5 Incohérences Frontend/Backend Matrice

| Sous-module | Backend Seed | Frontend matrix.js | Différence |
|-------------|--------------|-------------------|------------|
| `rapports` | Purge pour non-PATRON | Présent dans matrix pour COMPTABLE | OK (COMPTABLE a `rapports: true`) |
| `rapports_stock` | MAGASINIER ✅ | MAGASINIER ✅ | OK |
| `rapports_performance` | COMMERCIAL ✅ | COMMERCIAL ✅ | OK |

---

## 4. SOURCES DES 403 ACTUELS

| Endpoint | Rôle | Cause probable |
|----------|------|----------------|
| `/supermarche/rapports` | CAISSIER | Permission `rapports` absente (normal) |
| `/boutique/fournisseurs` | CAISSIER | Permission `fournisseurs` absente (normal) |
| `/depot/tournees` | CAISSIER | Permission `tournees` absente (normal) |
| `/boutique/depenses` | MAGASINIER | Permission `depenses` absente (normal) |
| `/supermarche/receptions` | CAISSIER | **Anormal** — seed donne `receptions: read=true` au CAISSIER |
| `/boutique/clients` | MAGASINIER | **Anormal** — seed donne `clients: read=true` au MAGASINIER |
| `/depot/fournisseurs` | CAISSIER | **Anormal** — seed donne `fournisseurs: read=true` au CAISSIER |

---

## 5. PLAN DE CORRECTION

### Phase 3 — Backend
1. **Créer `EstablishmentScopeGuard`** — Vérifie `user.depotId` / `UserDepot` pour GERANT
2. **Ajouter permission `establishments.create`** — Refuser pour GERANT
3. **Corriger seed permissions** — Aligner sur matrices de référence (retirer `receptions` CAISSIER, `promotions` MAGASINIER, `clients` MAGASINIER boutique, `fournisseurs` CAISSIER depot, `tournees` full pour MAGASINIER depot)
4. **Ajouter permissions rapports granulaires** — `reports.sales.read`, `reports.stock.read`, `reports.financial.read`, `reports.performance.read`
5. **Migrer données** — Purger vieilles lignes `rapports` monolithiques

### Phase 4 — Frontend
1. **Corriger `matrix.js`** — Aligner sur seed corrigé
2. **Filtrer sidebar pour GERANT** — Supprimer tout menu admin tenant
3. **Conditionner appels API dashboards** — `usePermission` avant fetch
4. **Cacher "Nouveau dépôt" pour GERANT** — Partout (sidebar, boutons, modales)

### Phase 5 — Tests
1. Tests d'isolation établissement GERANT
2. Tests création établissement par rôle
3. Tests rapports granulaires
4. Tests frontend : sidebar, routes, appels API

---

## 6. RISQUES DE SÉCURITÉ IDENTIFIÉS

| Risque | Sévérité | Description |
|--------|----------|-------------|
| GERANT accès multi-établissements | 🔴 CRITIQUE | Fuite de données entre établissements du même tenant |
| Création établissement par GERANT | 🔴 CRITIQUE | Élévation de privilèges vers admin tenant |
| Permissions trop larges (seed) | 🟠 MAJEUR | CAISSIER voit réceptions/fournisseurs, MAGASINIER voit clients/promotions |
| Rapports financiers exposés | 🟠 MAJEUR | Pas de granularité `financial.read` vs `stock.read` |

---

## 7. LIMITATIONS RESTANTES APRÈS CORRECTION

- L'isolation établissement repose sur `User.depotId` (défaut) + `UserDepot` (multi) — nécessite que l'authentification définisse correctement `depotId` à la connexion
- Le header `X-Depot-Id` reste injecté automatiquement — le backend doit l'ignorer pour GERANT au profit du scope calculé
- Les tests d'intégration RBAC complets nécessitent un environnement multi-tenant multi-établissement