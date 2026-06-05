# AUDIT_REPORT.md

## Phase 1 - Audit global

Date d'analyse: 2026-05-30

Objectif de cette phase: scanner le projet, identifier les erreurs critiques, majeures, mineures, routes cassees, imports casses, composants inutilises et dette technique. Aucune correction de bug n'a ete effectuee.

## Resume executif

Le projet compile en build production cote backend et frontend, mais il n'est pas stable en qualite CI:

- tests backend rouges;
- lint frontend massivement rouge;
- plusieurs appels API frontend actifs ne correspondent pas aux routes backend detectees;
- risque critique dans un guard global backend applique trop largement;
- forte dette de structure: backups inclus dans lint, pages legacy en parallele des modules, scripts de correction historiques, doublons de paiement, deux squelettes NestJS.

Statut Phase 1: audit termine, aucune correction appliquee.

## Verifications executees

### Backend - tests

Commande:

```bash
cd backend-depot
npm test -- --runInBand
```

Resultat:

- Echec.
- 5 suites lancees.
- 3 suites echouees.
- 2 suites passees.
- 6 tests au total.
- 4 tests echoues.

Causes observees:

- `src/tenants/tenants.service.spec.ts`: `PrismaService` non fourni au module de test.
- `src/tenants/tenants.controller.spec.ts`: `PrismaService` non fourni via `TenantsService`.
- `src/payments/payments.service.spec.ts`: `EmailService` manquant dans le module de test; `PaymentsService` depend aussi de `NotificationsService`.

### Backend - TypeScript

Commande:

```bash
cd backend-depot
npx tsc -p tsconfig.json --noEmit
```

Resultat:

- Succes.
- Aucune erreur TypeScript bloquante detectee avec `--noEmit`.

### Backend - build

Commande:

```bash
cd backend-depot
npm run build
```

Resultat:

- Succes.
- `nest build` termine sans erreur.

### Frontend - lint

Commande:

```bash
cd frontend-depot
npm run lint
```

Resultat:

- Echec.
- 2627 problemes.
- 2600 erreurs.
- 27 warnings.

Categories principales:

- variables/imports inutilises: `no-unused-vars`;
- variables non definies: `no-undef`;
- blocs vides: `no-empty`;
- dependances hooks manquantes: `react-hooks/exhaustive-deps`;
- appels `setState` directs dans certains effets: `react-hooks/set-state-in-effect`.

### Frontend - build

Commande:

```bash
cd frontend-depot
npm run build
```

Resultat:

- Succes.
- Vite transforme 2922 modules.
- Service worker PWA genere.
- Aucun import cassant detecte par le bundler.

## Erreurs critiques

### C1 - `QuotaDepotGuard` est global et bloque potentiellement tous les POST

Fichier:

- `backend-depot/src/app.module.ts`
- `backend-depot/src/common/guards/quota-depot.guard.ts`

Constat:

- `QuotaDepotGuard` est declare comme `APP_GUARD`, donc applique globalement.
- Le commentaire du fichier dit qu'il doit s'appliquer a `POST /api/v1/depots` uniquement.
- L'implementation autorise les methodes non-POST, mais pour tout `POST` protege elle verifie le quota de depots.

Impact:

- Si un tenant atteint `maxDepots`, des actions sans rapport avec la creation de depot peuvent etre bloquees: ventes, paiements, clients, stock, commandes, metiers.
- Risque fonctionnel tres eleve et source probable de 403 inattendus.

Correction a documenter pour phase ulterieure:

- Restreindre ce guard a la route de creation depot ou ajouter une condition explicite sur `request.path`.

### C2 - Tests backend rouges sur services structurants

Fichiers:

- `backend-depot/src/tenants/tenants.service.spec.ts`
- `backend-depot/src/tenants/tenants.controller.spec.ts`
- `backend-depot/src/payments/payments.service.spec.ts`

Impact:

- La base de test ne valide pas les modules SaaS critiques: tenants et paiements.
- Les regressions sur abonnement, TVA, paiement ou creation tenant ne sont pas couvertes de maniere fiable.

Correction a documenter pour phase ulterieure:

- Fournir des mocks de `PrismaService`, `EmailService`, `NotificationsService`, `NotchPayService` selon les specs.

### C3 - Lint frontend inutilisable en CI

Fichiers/zones:

- `frontend-depot/eslint.config.js`
- `frontend-depot/src/.backup-pages/**`
- `frontend-depot/src/pages/**`
- `frontend-depot/src/modules/**`
- `frontend-depot/src/shared/**`

Impact:

- 2600 erreurs lint rendent impossible l'utilisation du lint comme garde qualite.
- Les backups sous `src/.backup-pages` sont inclus dans lint.
- Des erreurs `no-undef` dans les backups indiquent du code non executable si jamais importe.

Correction a documenter pour phase ulterieure:

- Exclure les backups ou les sortir de `src`.
- Traiter par lot les erreurs actives hors backups.

### C4 - Appels API frontend actifs sans route backend correspondante

Scan effectue:

- 375 routes backend detectees.
- 277 appels API frontend litteraux actifs detectes.
- 47 appels API actifs ne correspondent pas exactement a une route backend detectee.

Exemples:

- `GET /boulangerie/parametres`
- `PUT /boulangerie/parametres`
- `GET /boutique/caisse`
- `PUT /boutique/parametres`
- `GET /clinique/config`
- `PATCH /clinique/config`
- `POST /depot-boissons/fournisseurs/commander`
- `GET /depot-boissons/caisse`
- `PUT /elevage/config`
- `GET /garage/caisse`
- `POST /garage/caisse`
- `PUT /garage/config`
- `GET /glacier_snack/caisse`
- `PUT /hotel/config`
- `GET /librairie/caisse`
- `POST /librairie/caisse`
- `PUT /librairie/parametres`
- `GET /pharmacie/parametres`
- `PATCH /pharmacie/parametres`
- `GET /pharmacie/stats/ventes`
- `GET /pressing/parametres`
- `PUT /pressing/parametres`
- `PUT /quincaillerie/config`
- `GET /restaurant/commandes`
- `PUT /restaurant/config`
- `GET /salon/parametres`
- `PUT /salon/parametres`
- `GET /salon/rendez-vous`
- `PUT /telephonie/config`
- `GET /transport/caisse`

Impact:

- Risque eleve de 404/500 selon les pages et workflows.
- A traiter en Phase 2/4 selon la nature: payload/backend ou route manquante.

## Erreurs majeures

### M1 - Routes statiques notifications declarees apres routes dynamiques

Fichier:

- `backend-depot/src/core/notifications/notifications.controller.ts`

Constat:

- `@Get(':id')` est declare avant `@Get('preferences')`.
- `@Delete(':id')` est declare avant `@Delete('all')`.
- `@Patch(':id/read')` coexiste avec `@Patch('read-all')`.

Impact:

- Selon l'ordre d'enregistrement Express/Nest, des routes statiques peuvent etre capturees comme `id`.
- Exemple a verifier: `/notifications/preferences`, `/notifications/all`.

Correction a documenter pour phase ulterieure:

- Placer toutes les routes statiques avant les routes dynamiques `:id`.

### M2 - Divergence de naming metiers frontend/backend

Exemples:

- frontend `hotel`, backend `hotellerie`;
- frontend `garage_automobile`, backend `garage`;
- frontend `glacier_snack`, backend `glacier`;
- frontend `salon_beaute`, backend `salon-beaute` avec controller `salon`;
- frontend `ciment_btp`, backend `ciment-btp`.

Impact:

- Risque de routes API incoherentes.
- Risque de logique metier dupliquee ou contournee.
- Plusieurs appels non matches viennent de ces divergences.

### M3 - Deux systemes de paiement coexistent

Fichiers:

- `backend-depot/src/payments/**`
- `backend-depot/src/paiement/**`

Constat:

- Routes `payments` et `paiements` coexistent.
- Providers Stripe, NotchPay et Campay sont presents.
- Le frontend contient `notchpayCheckout.ts`.

Impact:

- Risque de webhooks doublons.
- Risque de callback branche sur le mauvais controller.
- Risque d'etats paiement incoherents.

### M4 - Deux backends/squelettes NestJS coexistent

Zones:

- `backend-depot/src/**`
- `src/**` a la racine

Constat:

- Le dossier racine `src/` contient `app.module.ts`, `prisma.service.ts`, decorators/interceptors tenant, module hardware quotes.
- Il ne semble pas branche au backend principal.

Impact:

- Ambiguite pour les corrections futures.
- Risque de modifier le mauvais backend.
- Dette de nettoyage.

### M5 - Migrations Prisma dans un etat instable

Constat Git:

- Plusieurs anciennes migrations sont supprimees.
- Plusieurs nouvelles migrations sont non suivies.
- `schema.prisma` est modifie.
- Fichiers `.old`, `.tmp`, `.newModels` presents.

Impact:

- Risque eleve sur reproductibilite DB.
- Risque de divergence entre base locale, schema et historique migrations.

### M6 - Encodage corrompu dans plusieurs fichiers

Exemples observes:

- `DÃ©pÃ´t`, `TÃ©lÃ©phonie`, `Analyses IA exÃ©cutÃ©es`, logs backend corrompus.

Impact:

- UI non professionnelle.
- Rapports/logs difficiles a lire.
- Risque de comparaison texte et exports errones.

### M7 - Auth frontend logout ne contacte pas le backend

Fichier:

- `frontend-depot/src/contexts/AuthContext.jsx`

Constat:

- `logout()` supprime le localStorage, mais ne fait pas `POST /auth/logout`.

Impact:

- Le refresh token hash peut rester valide cote backend jusqu'a expiration ou remplacement.
- Risque de session persistante mal invalidee.

## Erreurs mineures

### m1 - `frontend-depot/package.json` garde le nom `temp-vite`

Impact:

- Faible, mais non professionnel.

### m2 - `package.json` racine sans scripts projet

Impact:

- Ambiguite pour demarrer/tester le monorepo.

### m3 - Scripts historiques de correction presents

Exemples:

- `backend-depot/fix_schema*.js`
- `backend-depot/fix_ts2564*.js`
- `backend-depot/clean_schema.js`
- `frontend-depot/update-*.cjs`
- `frontend-depot/fix_*.ps1`

Impact:

- Bruit fort dans le projet.
- Risque d'executer un script obsolete.

### m4 - Logs et rapports temporaires presents

Exemples:

- `backend-depot/build_errors*.txt`
- `backend-depot/backend_log.txt`
- `frontend-depot/rapport-gestock*.html`

Impact:

- Bruit repository.
- Risque d'inclure des informations locales.

## Routes cassees ou suspectes

### Routes frontend compilees mais suspectes API

Les routes React compilent, mais certaines pages appellent des endpoints non detectes cote backend.

Fichiers actifs concernes par les exemples:

- `frontend-depot/src/modules/boulangerie/pages/ParametresPage.jsx`
- `frontend-depot/src/modules/boutique/pages/CaissePage.jsx`
- `frontend-depot/src/modules/boutique/pages/ParametresPage.jsx`
- `frontend-depot/src/modules/clinique/pages/ParametresPage.jsx`
- `frontend-depot/src/modules/depot-boissons/services/depotApi.js`
- `frontend-depot/src/modules/elevage/pages/ParametresPage.jsx`
- `frontend-depot/src/modules/garage_automobile/pages/CaissePage.jsx`
- `frontend-depot/src/modules/garage_automobile/pages/ParametresPage.jsx`
- `frontend-depot/src/modules/glacier_snack/pages/CaissePage.jsx`
- `frontend-depot/src/modules/hotel/pages/ParametresPage.jsx`
- `frontend-depot/src/modules/librairie/pages/CaissePage.jsx`
- `frontend-depot/src/modules/librairie/pages/ParametresPage.jsx`
- `frontend-depot/src/modules/parfumerie/pages/ParametresPage.jsx`
- `frontend-depot/src/modules/pharmacie/pages/ParametresPage.jsx`
- `frontend-depot/src/modules/pharmacie/pages/VentesPage.jsx`
- `frontend-depot/src/modules/pressing/pages/ParametresPage.jsx`
- `frontend-depot/src/modules/quincaillerie/pages/ParametresPage.jsx`
- `frontend-depot/src/modules/restaurant/pages/CaissePage.jsx`
- `frontend-depot/src/modules/restaurant/pages/CuisinePage.jsx`
- `frontend-depot/src/modules/restaurant/pages/ParametresPage.jsx`
- `frontend-depot/src/modules/salon_beaute/pages/ParametresPage.jsx`
- `frontend-depot/src/modules/salon_beaute/pages/RendezVousPage.jsx`
- `frontend-depot/src/modules/telephonie/pages/ParametresPage.jsx`
- `frontend-depot/src/modules/transport/pages/CaissePage.jsx`

### Pages legacy avec endpoints probablement obsoletes

Fichiers:

- `frontend-depot/src/pages/pharmacie/PharmaciePage.jsx`
- `frontend-depot/src/pages/restaurant/RestaurantPage.jsx`
- `frontend-depot/src/pages/telephonie/TelephoniePage.jsx`

Endpoints suspects:

- `/medicaments`
- `/ordonnances`
- `/restaurant/tables`
- `/restaurant/plats`
- `/restaurant/commandes`
- `/telephones`
- `/reparations`

## Imports casses

Resultat build:

- Aucun import cassant detecte par `npm run build` backend.
- Aucun import cassant detecte par `npm run build` frontend.

Limite:

- Le build ne garantit pas que les appels API et workflows runtime soient valides.
- Les fichiers dans `.backup-pages` ne semblent pas bloques par le build mais sont analyses par lint.

## Composants/fichiers inutilises ou suspects

Le lint detecte principalement des variables et imports inutilises, pas un graphe complet de composants morts. Exemples:

- `frontend-depot/src/shared/components/DataTable.jsx`: `useMemo` inutilise.
- `frontend-depot/src/shared/components/DateRangePicker.jsx`: `useState` inutilise.
- `frontend-depot/src/shared/components/ExportButton.jsx`: `className` inutilise.
- `frontend-depot/src/shared/components/forms/NumberInput.jsx`: `displayValue` inutilise.
- `frontend-depot/src/pages/LandingPage.jsx`: `Icon` inutilise a plusieurs endroits.
- `frontend-depot/src/pages/PricingPage.jsx`: `step` inutilise.
- `frontend-depot/src/pages/StocksPage.jsx`: `loading` inutilise.
- `frontend-depot/scripts/migrate-module-pages.js`: variables inutilisees.

Zones a auditer plus tard pour code mort:

- `frontend-depot/src/.backup-pages/**`
- pages legacy sous `frontend-depot/src/pages/<metier>/**`
- scripts de migration/correction frontend et backend
- squelette racine `src/**`

## Dette technique globale

### Architecture

- Backend principal et squelette backend racine coexistent.
- Frontend a la fois modulaire (`src/modules`) et legacy (`src/pages`).
- Plusieurs modules ont des routes/pages admin repetees (`utilisateurs`, `depots`, `abonnement`).
- Config metier presente dans plusieurs endroits.

### Qualite

- Lint frontend trop bruite pour etre actionnable.
- Tests backend faibles et casses.
- Peu de tests metiers visibles.
- Pas de script de test frontend.

### Securite / isolation

- Multi-tenant present, mais doit etre audite requete par requete en Phase 6.
- `SaasGuard` compare `tenantId` client avec `userTenantId`, mais accepte plusieurs sources client avant comparaison.
- `QuotaDepotGuard` global cree un risque fonctionnel fort.
- Logout frontend incomplet cote invalidation backend.

### Produit

- Beaucoup de modules metiers existent, mais leurs APIs ne sont pas toutes alignees avec le frontend.
- Parametres/config/caisse metier semblent incomplets ou non harmonises.

## Priorites recommandees

1. Phase 2: traiter les erreurs 500, en commencant par les endpoints API non matches et les guards globaux.
2. Phase 3: scanner les routes React en runtime, malgre le build OK.
3. Phase 4: auditer routes frontend/backend et normaliser les slugs metiers.
4. Phase 5/6: verifier auth et isolation tenant avant tout nettoyage massif.
5. Phase 18 seulement: supprimer backups, scripts morts et squelette racine apres validation.

## Stabilite avant etape suivante

Etat apres Phase 1:

- Backend build: OK.
- Backend TypeScript noEmit: OK.
- Backend tests: KO.
- Frontend build: OK.
- Frontend lint: KO.
- Aucune correction de code effectuee.

Conclusion:

- Le projet est compilable, mais non stable pour production.
- La Phase 2 peut commencer, mais elle doit etre limitee aux erreurs 500 et aux causes backend/frontend associees.
