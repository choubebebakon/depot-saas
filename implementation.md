# GeStock — Plan d'implémentation complet (Mise à niveau 3 modules métier)

> Version : 2026-07-31 | Auteur : Antigravity AI | Statut : EN COURS

---

## 0. Résumé de l'exploration préalable

### Structure confirmée
- **Backend** : NestJS + Prisma + PostgreSQL (`backend-depot/src/`)
- **Frontend** : React + Vite (`frontend-depot/src/modules/`)
- **3 métiers actifs** : `depot-boissons`, `boutique`, `supermarche`
- **Upload** : `/upload/image` (multer, stockage disque `./uploads/`) — déjà opérationnel
- **Export** : `shared/services/exportService.js` — jsPDF + XLSX déjà disponibles
- **Notifications** : `core/notifications/` — service + scheduler + templates déjà en place
- **Chatbot IA** : `modules/chatbot/chatbot.service.ts` — Gemini, lecture DB en temps réel

### État actuel des 3 modules

#### Dépôt Boissons
- ✅ `CaissePage.jsx` : complet (ouvrir/fermer/mouvements/rapport)
- ✅ `StockArticlesPage.jsx` : complet
- ⚠️ Route `/depot/articles` duplique `/depot/stock` (point 2.2)
- ❌ `ParametresPage.jsx` : manque logo upload + nom caissier
- ❌ `ArticleBoissonsForm.jsx` : manque photo produit + date péremption
- ❌ `RapportsPage.jsx` : manque export PDF/Excel, pas de polling temps réel

#### Boutique
- ⚠️ `CaissePage.jsx` : stub — redirige vers `VenteBoutiqueForm` (point 2.1)
- ⚠️ `PersonnelPage.jsx` : lit `User` via `/boutique/personnel` (même table que Utilisateur)
- ❌ `ParametresPage.jsx` : manque logo + nom caissier
- ❌ `StockPage.jsx` : manque photo produit + date péremption
- ❌ `RapportsPage.jsx` : manque export PDF/Excel, pas de polling

#### Supermarché
- ⚠️ `POSCaissePage.jsx` : stub minimal (appelle `POSSupermarcheForm`)
- ❌ Pas de sous-module "Caisse" style depot (ouvrir/fermer session) — point 2.1
- ❌ `ParametresPage.jsx` : manque logo + nom caissier
- ❌ `StockPage.jsx` : manque photo produit + date péremption
- ❌ `RapportsPage.jsx` : manque export PDF/Excel, pas de polling

---

## PARTIE 1 — Fonctionnalités transverses

### 1.1 Formulaires et cohérence UI
**Fichiers concernés :**
- `frontend/modules/boutique/forms/` — compléter tous les formulaires
- `frontend/modules/supermarche/forms/` — compléter tous les formulaires
- `frontend/modules/depot boissons/forms/` — compléter tous les formulaires
- Utilisation du pattern `react-hook-form + zod` déjà en place

### 1.2 Rapports — Export PDF + Excel + Polling temps réel
**Fichiers concernés :**
- `frontend/modules/boutique/pages/RapportsPage.jsx` — ajouter boutons export + polling (refetchInterval: 30s)
- `frontend/modules/supermarche/pages/RapportsPage.jsx` — idem
- `frontend/modules/depot-boissons/pages/RapportsPage.jsx` — idem
- Réutiliser `shared/services/exportService.js` (déjà prêt)

### 1.3 Dashboards temps réel
**Fichiers concernés :**
- `frontend/modules/boutique/pages/DashboardBoutique.jsx` — ajouter `refetchInterval: 30_000`
- `frontend/modules/supermarche/pages/DashboardSupermarche.jsx` — idem
- `frontend/modules/depot-boissons/pages/DashboardDepot.jsx` — déjà avec `refetchInterval: 10_000` (vérifier)

### 1.4 Alertes stock et péremption via IA
**Backend fichiers concernés :**
- `backend/src/core/notifications/notifications.scheduler.ts` — étendre `checkStockCritique()` pour les 3 métiers
- `backend/src/modules/chatbot/chatbot.service.ts` — ajouter détection péremption + alerte proactive
- Le scheduler existe déjà mais ne couvre que Pharmacie pour les DLC → étendre aux 3 métiers actifs

### 1.5 Photo produit (upload image)
**Fichiers concernés :**
- `frontend/modules/depot-boissons/forms/ArticleBoissonsForm.jsx` — ajouter champ upload
- `frontend/modules/boutique/forms/` — identifier le formulaire article et ajouter upload
- `frontend/modules/supermarche/forms/` — idem
- Backend : `POST /upload/image` déjà disponible → réutiliser directement
- Migration Prisma : ajouter champ `photoUrl String?` à `Article` si absent

### 1.6 Date + heure de péremption
**Fichiers concernés :**
- Migration Prisma : ajouter `datePeremption DateTime?` au modèle `Article`
- `frontend/modules/depot-boissons/forms/ArticleBoissonsForm.jsx` — ajouter champ datetime-local
- `frontend/modules/boutique/forms/` — idem
- `frontend/modules/supermarche/forms/` — idem
- Backend : mettre à jour les DTOs et services pour accepter/retourner ce champ

### 1.7 Module Paramètres complet
**Fichiers concernés (3 métiers) :**
- `frontend/modules/depot-boissons/pages/ParametresPage.jsx` — ajouter : nom caissier, logo upload, devise
- `frontend/modules/boutique/pages/ParametresPage.jsx` — idem
- `frontend/modules/supermarche/pages/ParametresPage.jsx` — idem
- Backend : les endpoints `/depot/parametres`, `/boutique/parametres`, `/supermarche/parametres` → stocker `logoUrl`, `nomCaissier`, `devise` en DB

### 1.8 Ticket de caisse professionnel (80mm, thermique)
**Décision** : Utiliser `@react-pdf/renderer` ou impression native du navigateur (CSS `@media print` + `width: 80mm`) pour le format thermique. Pas de Web Bluetooth sans confirmation utilisateur.
**Fichiers concernés :**
- Créer `frontend/shared/components/TicketCaisse.jsx` — composant ticket 80mm
- Intégrer dans les pages Caisse/Ventes des 3 métiers
- Lire `logoUrl` et `nomCaissier` depuis les Paramètres

### 1.9 Performance POS Supermarché
**Fichiers concernés :**
- `frontend/modules/supermarche/forms/POSSupermarcheForm.jsx` — auditer + optimiser :
  - Debounce recherche produit (300ms)
  - `React.memo` sur les composants de liste de produits
  - Virtualisation si liste > 100 produits (`react-window` ou `@tanstack/react-virtual`)
  - Cache React Query pour les produits

---

## PARTIE 2 — Corrections spécifiques

### 2.1 Sous-module Caisse pour Boutique et Supermarché

#### Exploration confirmée :
- **Dépôt Boissons** : `CaissePage.jsx` complet — ouverture/fermeture/mouvements via `/caisse/*` (routes génériques, pas prefixées depot)
- **Boutique** : `CaissePage.jsx` = stub (redirige vers `VenteBoutiqueForm`)
- **Supermarché** : `POSCaissePage.jsx` = stub (redirige vers `POSSupermarcheForm`)

#### Actions :
**Backend :**
- Créer `backend/src/modules/boutique/boutique-caisse.controller.ts` avec routes `POST /boutique/caisse/ouvrir`, `POST /boutique/caisse/fermer`, `GET /boutique/caisse/session-active`, `GET /boutique/caisse/resume`
- Créer `backend/src/modules/supermarche/supermarche-caisse.controller.ts` avec routes `POST /supermarche/caisse/ouvrir`, etc.
- Réutiliser le modèle Prisma `SessionCaisse` + `MouvementCaisse` qui sont communs (pas besoin de nouveaux modèles)

**Frontend :**
- Réécrire `frontend/modules/boutique/pages/CaissePage.jsx` — calquer sur le modèle depot-boissons, sans la partie "Retour de consignes" (spécifique depot), avec "Saisir vente" adapté
- Créer `frontend/modules/supermarche/pages/CaissePage.jsx` — même logique
- Ajouter item "Caisse" dans sidebar supermarché si absent (déjà présent : "POS/Caisse" → à séparer ou refactoriser)
- `VentesPage` Boutique : rester dédiée aux ventes; `CaissePage` Boutique : dédiée session caisse

**Services frontend :**
- Ajouter dans `boutiqueApi.js` : `ouvrirCaisse`, `fermerCaisse`, `getCaisseSession`, `mouvementCaisse`, `rapportJournalier`
- Créer `supermarcheApi.js` si absent : mêmes méthodes pour `/supermarche/caisse/*`

### 2.2 Dépôt Boissons : doublon Stock / Article

#### Exploration confirmée :
- Route `/depot/articles` et `/depot/stock` → même composant `StockArticlesPage.jsx`
- Dans `routes.jsx` lignes 156-157 : les deux routes pointent vers `StockArticlesPage`
- Le sidebar n'affiche que "Stock & Articles" — pas de doublon UI visible

#### Actions :
- Supprimer la route `/depot/articles` dans `routes.jsx` (redirection vers `/depot/stock`)
- Vérifier toutes les références à `/depot/articles` dans le frontend : **grep effectué**
- Backend `depot-boissons.controller.ts` : l'endpoint `/articles` est distinct de `/stock` mais les 2 sont utilisés par `StockArticlesPage`
- **Décision** : conserver les endpoints backend (`/depot/articles` pour CRUD article, `/depot/stock` pour niveaux de stock) — c'est une séparation logique correcte. Supprimer uniquement la route frontend dupliquée et nettoyer le sidebar si "Article" y apparaît séparément.

### 2.3 Boutique : doublon Personnel / Utilisateur

#### Exploration confirmée :
- `PersonnelPage.jsx` appelle `boutiqueApi.getPersonnel()` → `GET /boutique/personnel`
- Le service backend `PersonnelService` dans `boutique.service.ts` requête la table `User` (pas une table séparée)
- **Données** : pas de table séparée, tout est dans `User` → pas de migration nécessaire

#### Actions :
- Supprimer l'entrée "Personnel" du `sidebar.config.js` de Boutique
- Supprimer la route `/boutique/personnel` dans `routes.jsx` Boutique
- Vérifier aucun import actif (grep)
- Optionnel : conserver `PersonnelPage.jsx` et `boutiqueApi.getPersonnel` en commentaire pour référence future, ou supprimer proprement

---

## Ordre d'exécution

| # | Point | Priorité | Impact DB |
|---|-------|----------|-----------|
| 1 | 2.3 — Supprimer Personnel Boutique | Facile, pas de migration | Non |
| 2 | 2.2 — Nettoyer doublon Articles/Stock dépôt | Facile | Non |
| 3 | 1.6 — Champ datePeremption | Prisma migration | **Oui** |
| 4 | 1.5 — Photo produit + upload | Prisma + frontend | **Oui** |
| 5 | 1.7 — Paramètres complet (logo, caissier, devise) | Prisma + frontend/backend | **Oui** |
| 6 | 2.1 — Caisse Boutique + Supermarché | Backend endpoints + frontend | Non |
| 7 | 1.2 — Exports PDF/Excel + polling rapports | Frontend only | Non |
| 8 | 1.3 — Dashboards temps réel | Frontend only | Non |
| 9 | 1.4 — Alertes IA stock/péremption | Backend scheduler + chatbot | Non |
| 10 | 1.8 — Ticket caisse professionnel 80mm | Frontend composant | Non |
| 11 | 1.9 — Performance POS Supermarché | Frontend audit | Non |
| 12 | 1.1 — Formulaires manquants | Frontend forms | Non |

---

## Décisions architecturales

### Upload images
- Endpoint existant : `POST /upload/image` (multer, disque `./uploads/`, 5MB max, jpg/png/gif/webp)
- Retourne `{ url: '/uploads/filename.ext' }` 
- Frontend : champ `<input type="file">` + appel direct à `/upload/image`
- DB : champ `photoUrl String?` sur `Article`

### Ticket thermique 80mm
- Solution choisie : CSS `@media print` avec `width: 80mm` — fonctionne sur tous les navigateurs
- Pas de dépendance supplémentaire (évite Web Bluetooth qui nécessite HTTPS + approbation utilisateur)
- Impression via `window.print()` avec styles dédiés

### Caisse Boutique/Supermarché
- Réutilisation du modèle Prisma `SessionCaisse` + `MouvementCaisse` existants
- Pas de nouvelle migration pour ces entités
- Nouveaux endpoints NestJS dans les modules respectifs

### Polling temps réel
- Utiliser `refetchInterval: 30_000` dans les useQuery des rapports et dashboards
- Cohérent avec le pattern déjà utilisé dans `CaissePage.jsx` (depot) qui utilise `refetchInterval: 10_000`

---

## Fichiers à créer (nouveaux)
- `frontend/modules/boutique/pages/CaissePage.jsx` — réécrire complet
- `frontend/modules/supermarche/pages/CaissePage.jsx` — nouveau (session caisse)
- `frontend/shared/components/TicketCaisse.jsx` — ticket 80mm
- `backend/src/modules/boutique/boutique-caisse.service.ts`
- `backend/src/modules/boutique/boutique-caisse.controller.ts`
- `backend/src/modules/supermarche/supermarche-caisse.service.ts`  
- `backend/src/modules/supermarche/supermarche-caisse.controller.ts`
- `prisma/migrations/YYYYMMDD_add_article_photo_peremption/` — nouvelle migration

## Fichiers à modifier
- `frontend/modules/boutique/sidebar.config.js` — supprimer Personnel
- `frontend/modules/boutique/routes.jsx` — supprimer route personnel, ajouter CaissePage réelle
- `frontend/modules/supermarche/routes.jsx` — ajouter CaissePage réelle, ajouter sidebar caisse
- `frontend/modules/supermarche/sidebar.config.js` — séparer POS/Caisse en deux items si nécessaire
- `frontend/modules/depot-boissons/routes.jsx` — supprimer doublon route articles
- `frontend/modules/*/pages/RapportsPage.jsx` — export + polling (3 fichiers)
- `frontend/modules/*/pages/DashboardXxx.jsx` — polling (3 fichiers)
- `frontend/modules/*/pages/ParametresPage.jsx` — logo + caissier + devise (3 fichiers)
- `frontend/modules/*/forms/ArticleXxxForm.jsx` — photo + péremption (3 fichiers)
- `backend/src/modules/boutique/boutique.module.ts` — ajouter CaisseModule boutique
- `backend/src/modules/supermarche/supermarche.module.ts` — ajouter CaisseModule supermarché
- `backend/src/core/notifications/notifications.scheduler.ts` — étendre DLC checks
- `backend/src/modules/chatbot/chatbot.service.ts` — ajouter alerte péremption proactive
- `backend/prisma/schema.prisma` — champs `photoUrl`, `datePeremption`, `logoUrl`, `nomCaissier` sur les bons modèles

## Fichiers à supprimer (après vérification)
- Route `/boutique/personnel` dans `routes.jsx` (la page peut rester pour référence)
- Route `/depot/articles` dans `routes.jsx` (doublon de `/depot/stock`)
