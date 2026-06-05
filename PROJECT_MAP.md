# PROJECT_MAP.md

## Phase 0 - Comprehension du projet

Date d'analyse: 2026-05-30

Objectif de cette phase: cartographier le projet sans correction de code.

## Synthese

Le repository contient une plateforme SaaS GeStock orientee multi-metiers, avec:

- un backend principal NestJS dans `backend-depot/`;
- un frontend React/Vite dans `frontend-depot/`;
- un second squelette NestJS racine dans `src/`, distinct du backend principal;
- Prisma/PostgreSQL comme couche de donnees principale;
- des modules metiers pour depot de boissons, supermarche, pharmacie, restaurant, hotellerie, elevage, garage, telephonie, quincaillerie, pressing, boulangerie, clinique, transport, immobilier, librairie, parfumerie, glacier/snack, salon beaute, ciment/BTP et boutique.

Etat du workspace au moment de l'analyse: beaucoup de fichiers modifies, supprimes et non suivis existent deja. Aucune modification de code n'a ete faite dans cette phase.

## Structure du projet

```text
.
|-- backend-depot/          Backend NestJS principal
|-- frontend-depot/         Frontend React 19 + Vite
|-- src/                    Squelette NestJS racine separe
|-- node_modules/           Dependances racine
|-- app.py                  Script Python racine
|-- package.json            Dependances racine minimales
|-- start.bat
|-- studio.bat
```

## Frontend

Chemin: `frontend-depot/`

Stack:

- React `^19.2.4`
- Vite `^8.0.4`
- React Router DOM `^7.14.0`
- TanStack React Query `^5.99.1`
- Axios `^1.15.0`
- Tailwind CSS `^3.4.17`
- Socket.IO client `^4.8.3`
- PWA via `vite-plugin-pwa` et Workbox
- UI/icons: `lucide-react`

Points d'entree:

- `frontend-depot/src/main.jsx`
- `frontend-depot/src/App.jsx`
- `frontend-depot/src/api/axios.js`
- `frontend-depot/src/contexts/AuthContext.jsx`
- `frontend-depot/src/contexts/DepotContext.jsx`
- `frontend-depot/src/context/DataContext.jsx`
- `frontend-depot/src/context/NotifContext.jsx`

Architecture observee:

- Routes publiques dans `App.jsx`: `/`, `/login`, `/register`, `/pricing`, `/contact`, `/cgu`, `/features`, `/app-mobile`, `/securite`, `/solutions/*`, `/api-docs`, `/aide`, `/blog`, `/about`, `/careers`.
- Routes protegees par `PrivateRoute`.
- Routes metiers protegees par `SectorGuard`.
- Modules metiers sous `frontend-depot/src/modules/*`.
- Pages legacy/generalistes sous `frontend-depot/src/pages/*`.
- Composants partages sous `frontend-depot/src/shared/*`.
- Composants admin sous `frontend-depot/src/components/admin/*`.
- ErrorBoundary global deja present dans `frontend-depot/src/components/ErrorBoundary.jsx` et enveloppe les routes dans `App.jsx`.

Routes metiers principales:

- `/depot/*` -> `modules/depot-boissons/routes`
- `/supermarche/*` -> `modules/supermarche/routes`
- `/pharmacie/*` -> `modules/pharmacie/routes`
- `/hotel/*` -> `modules/hotel/routes`
- `/restaurant/*` -> `modules/restaurant/routes`
- `/clinique/*` -> `modules/clinique/routes`
- `/elevage/*` -> `modules/elevage/routes`
- `/garage/*` -> `modules/garage_automobile/routes`
- `/quincaillerie/*` -> `modules/quincaillerie/routes`
- `/immobilier/*` -> `modules/immobilier/routes`
- `/librairie/*` -> `modules/librairie/routes`
- `/boutique/*` -> `modules/boutique/routes`
- `/transport/*` -> `modules/transport/routes`
- `/boulangerie/*` -> `modules/boulangerie/routes`
- `/parfumerie/*` -> `modules/parfumerie/routes`
- `/salon/*` -> `modules/salon_beaute/routes`
- `/telephonie/*` -> `modules/telephonie/routes`
- `/pressing/*` -> `modules/pressing/routes`
- `/ciment-btp/*` -> `modules/ciment_btp/routes`
- `/glacier/*` -> `modules/glacier_snack/routes`

Configuration metiers:

- `frontend-depot/src/modules/ModuleRegistry.js` declare 20 metiers.
- Les prefixes frontend sont centralises dans `METIER_MODULES`.
- Des modules utilisent des noms frontend differents du backend, par exemple `hotel` cote frontend et `hotellerie` cote backend, `garage_automobile` cote frontend et `garage` cote backend.

Client API:

- `frontend-depot/src/api/axios.js`
- Base URL par defaut: `http://localhost:3000/api/v1`
- Injection automatique du token `depot_token` dans `Authorization`.
- Injection automatique de `X-Depot-Id` et `depotId` depuis `localStorage.depot_actif_id`, sauf pour certaines routes globales.
- Gestion refresh token via `POST /auth/refresh`.
- Redirection vers `/login` en cas d'echec refresh.
- Gestion paywall via evenement `saas-paywall-locked` sur HTTP 402.

## Backend

Chemin: `backend-depot/`

Stack:

- NestJS `^11.1.19`
- Prisma `^7.7.0` / `@prisma/client ^7.8.0`
- PostgreSQL via `pg` et `@prisma/adapter-pg`
- JWT / Passport
- Socket.IO / WebSockets
- Swagger
- `nestjs-pino` / Pino
- SendGrid / Nodemailer
- Sentry
- Stripe, NotchPay, Campay

Points d'entree:

- `backend-depot/src/main.ts`
- `backend-depot/src/app.module.ts`
- `backend-depot/src/prisma.service.ts`
- `backend-depot/prisma/schema.prisma`

Configuration serveur:

- Prefixe global API: `/api/v1`
- Swagger: `/api/docs`
- Port: `3000`
- CORS autorise: `http://localhost:5173`
- Validation globale: `ValidationPipe({ whitelist: true, transform: true })`
- Body JSON limite a `50mb`
- Cookies parses via `cookie-parser`

Guards globaux declares dans `AppModule`:

- `JwtAuthGuard`
- `SaasGuard`
- `AccessStatusGuard`
- `QuotaDepotGuard`
- `RolesGuard`
- `ThrottlerGuard`

Modules backend importes dans `AppModule`:

- Auth, Tenants, Consignes, Depots, DepotBoissons
- Maintenance, Commissions, Articles, DLC, Stocks, Ventes
- Impression, Users, Paiement, Catalogue, Audit, Rapports
- Clients, Fournisseurs, Caisse, Tournees, Commandes
- Admin, Payments, Tasks, Onboarding, Email, Notifications
- Boutique, Supermarche, CimentBtp, Pressing, Quincaillerie
- Pharmacie, Restaurant, Telephonie, Elevage, SalonBeaute
- Parfumerie, Boulangerie, Glacier, Librairie, Clinique
- Transport, Immobilier, Hotellerie, Garage, Chatbot

Surface API observee:

- 56 declarations `@Controller`
- environ 375 handlers HTTP (`@Get`, `@Post`, `@Put`, `@Patch`, `@Delete`)
- Routes principales sous `/api/v1/*`

Controllers principaux:

- `auth`: register, login, refresh, logout, me
- `tenants`: create, update, list, detail
- `depots`: CRUD depot
- `:metier/depots`: CRUD depot contextualise par metier
- `users`: utilisateurs, employees, commerciaux, status, delete
- `:metier/utilisateurs`: utilisateurs contextualises par metier
- `articles`, `catalogue`, `stocks`, `ventes`, `clients`, `fournisseurs`
- `commandes`, `tournees`, `caisse`, `consignes`, `dlc`
- `rapports`, `analyses`, `audit`, `exports`, `impression`
- `admin`, `maintenance`, `commissions`, `onboarding`
- `payments`, `payments/webhook`, `payments/webhooks/stripe`, `payments/webhooks/campay`
- `paiements`
- `notifications`
- modules metiers: `depot-boissons`, `supermarche`, `pharmacie`, `restaurant`, `hotellerie`, `elevage`, `garage`, `telephonie`, `quincaillerie`, `pressing`, `boulangerie`, `clinique`, `transport`, `immobilier`, `librairie`, `parfumerie`, `glacier`, `salon`, `ciment-btp`, `boutique`, `chatbot`

## Prisma

Chemin: `backend-depot/prisma/schema.prisma`

Datasource:

- PostgreSQL

Generator:

- `prisma-client-js`
- preview feature: `driverAdapters`

Taille du schema:

- 98 modeles
- 51 enums

Domaines couverts par les modeles:

- SaaS/tenant: `Tenant`, `User`, `Depot`, `Payment`, `RefreshToken`, `PaiementSouscription`
- Catalogue/stock: `Article`, `Famille`, `Marque`, `Conditionnement`, `Stock`, `LotStock`, `MouvementStock`
- Ventes/achats: `Vente`, `LigneVente`, `CommandeFournisseur`, `ReceptionFournisseur`
- Clients/fournisseurs: `Client`, `Fournisseur`, `DetteClient`, `CreditClient`
- Consignes: `TypeConsigneConfig`, `PortefeuilleConsigne`, `MouvementConsigne`
- Tournees: `Tricycle`, `Tournee`, `LigneChargement`
- Caisse/audit: `SessionCaisse`, `MouvementCaisse`, `Depense`, `JournalAudit`
- Notifications: `Notification`, `NotificationPreference`, `NotificationTemplate`
- Paiements: `Payment`, enums `PaymentStatus`, `PaymentMethod`
- Metiers: pharmacie, restaurant, supermarche, quincaillerie/BTP, pressing, garage, elevage, salon, parfumerie, boulangerie, glacier, librairie, clinique, transport, immobilier, hotellerie

Multi-tenant Prisma:

- La majorite des modeles metiers possedent `tenantId`.
- Plusieurs modeles ont `@@index([tenantId])`.
- Certains modeles sont aussi scopes par `depotId`.
- Le schema utilise de nombreuses relations `Tenant @relation(... onDelete: Cascade)`.

## Multi-tenant

Elements existants:

- `Tenant` dans Prisma.
- `tenantId` dans JWT.
- `depotId` dans JWT quand disponible.
- `DepotScopeService` et middleware global dans `main.ts`.
- Header frontend `X-Depot-Id`.
- Guards SaaS: `SaasGuard`, `AccessStatusGuard`, `QuotaDepotGuard`.
- Routes contextualisees `:metier/depots` et `:metier/utilisateurs`.

Points a surveiller:

- Le middleware initialise `tenantId: null` dans `DepotScopeService`; l'isolation effective depend donc fortement des guards/services qui recuperent ensuite `tenantId` depuis l'utilisateur JWT.
- Le frontend injecte `depotId`, mais l'isolation tenant ne doit jamais dependre d'une valeur envoyee par le client.
- La verification exhaustive des requetes Prisma par tenant reste a faire en Phase 6.

## Authentification

Elements existants:

- `AuthModule`
- `AuthService`
- `JwtAuthGuard`
- `JwtRefreshGuard`
- `JwtStrategy`
- `JwtRefreshStrategy`
- DTO login/register
- Decorators `@Public`, `@CurrentUser`, `@Roles`, `@Metier`

Flux observe:

- `POST /api/v1/auth/register`: cree tenant + depot principal + user patron.
- `POST /api/v1/auth/login`: verifie password bcrypt, genere access token et refresh token.
- Refresh token stocke hashe avec Argon2 dans `User.refreshTokenHash`.
- `POST /api/v1/auth/refresh`: regenere access token depuis refresh token.
- `POST /api/v1/auth/logout`: supprime le hash refresh token.
- `GET /api/v1/auth/me`: retourne l'utilisateur courant.

Roles:

- Enums Prisma `Role` et `RoleUser`.
- Guards roles globaux.
- RBAC aussi present cote frontend dans `frontend-depot/src/utils/rbac.js`.

## Paiements

Modules/fichiers observes:

- `backend-depot/src/payments/*`
- `backend-depot/src/paiement/*`
- `frontend-depot/src/api/notchpayCheckout.ts`

Providers observes:

- Stripe: `stripe.service.ts`, `stripe-webhook.controller.ts`
- NotchPay: `notchpay.service.ts`
- Campay: `campay.service.ts`, `campay-webhook.controller.ts`
- Controller general `payments`
- Controller legacy/alternatif `paiements`

Routes observees:

- `POST /api/v1/payments`
- `POST /api/v1/payments/init`
- `POST /api/v1/payments/webhook`
- `POST /api/v1/payments/webhooks/stripe`
- `POST /api/v1/payments/webhooks/campay`
- `POST /api/v1/paiements/webhook`

Points a clarifier en Phase 7:

- coexistence de `payments` et `paiements`;
- mapping exact NotchPay MTN/Orange/Visa/Mastercard;
- verification signatures webhooks;
- callbacks frontend.

## Notifications

Backend:

- `backend-depot/src/core/notifications/notifications.module.ts`
- `notifications.controller.ts`
- `notifications.service.ts`
- `notifications.gateway.ts`
- `notifications.scheduler.ts`
- channels email, push, whatsapp, dispatcher

Frontend:

- `frontend-depot/src/core/notifications/NotificationBell.jsx`
- `NotificationToast.jsx`
- `NotificationsPage.jsx`
- `NotificationPreferencesPanel.jsx`
- `useNotifications.js`

Routes observees:

- `POST /api/v1/notifications/ai/run`
- `GET /api/v1/notifications`
- `GET /api/v1/notifications/unread`
- `GET /api/v1/notifications/stats`
- `GET /api/v1/notifications/:id`
- `PATCH /api/v1/notifications/:id/read`
- `PATCH /api/v1/notifications/read-all`
- `DELETE /api/v1/notifications/:id`
- `DELETE /api/v1/notifications/all`
- `GET /api/v1/notifications/preferences`
- `PATCH /api/v1/notifications/preferences`
- `POST /api/v1/notifications/test`

Point critique probable:

- Les routes statiques `read-all` et `preferences` sont declarees apres `:id` dans le controller d'apres la sortie `rg`; cela peut provoquer une capture par `:id` selon l'ordre effectif NestJS/Express. A confirmer en Phase 8.

## Modules metiers identifies

Modules frontend et backend alignes partiellement:

- Depot boissons: frontend `depot-boissons`, backend `depot-boissons`
- Supermarche: frontend `supermarche`, backend `supermarche`
- Pharmacie: frontend `pharmacie`, backend `pharmacie`
- Restaurant: frontend `restaurant`, backend `restaurant`
- Clinique: frontend `clinique`, backend `clinique`
- Elevage: frontend `elevage`, backend `elevage`
- Telephonie: frontend `telephonie`, backend `telephonie`
- Quincaillerie: frontend `quincaillerie`, backend `quincaillerie`
- Pressing: frontend `pressing`, backend `pressing`
- Boulangerie: frontend `boulangerie`, backend `boulangerie`
- Transport: frontend `transport`, backend `transport`
- Immobilier: frontend `immobilier`, backend `immobilier`
- Librairie: frontend `librairie`, backend `librairie`
- Parfumerie: frontend `parfumerie`, backend `parfumerie`
- Boutique: frontend `boutique`, backend `boutique`
- Ciment/BTP: frontend `ciment_btp`, backend `ciment-btp`
- Salon beaute: frontend `salon_beaute`, backend `salon-beaute` avec controller `salon`
- Glacier/snack: frontend `glacier_snack`, backend `glacier`
- Hotel: frontend `hotel`, backend `hotellerie`
- Garage: frontend `garage_automobile`, backend `garage`

## Squelette racine distinct

Le dossier racine `src/` contient un autre squelette NestJS:

- `src/app.module.ts`
- `src/app.controller.ts`
- `src/prisma/prisma.module.ts`
- `src/prisma/prisma.service.ts`
- `src/modules/hardware/quotes/*`
- decorators/interceptors tenant.

Ce code ne semble pas branche au backend principal `backend-depot/`. Il doit etre classe comme legacy, prototype ou module separe avant tout nettoyage.

## Dependances principales

Backend:

- `@nestjs/*`, `@prisma/client`, `prisma`, `pg`
- `passport`, `passport-jwt`, `@nestjs/jwt`
- `bcrypt`, `argon2`
- `class-validator`, `class-transformer`
- `socket.io`, `@nestjs/websockets`
- `stripe`, `axios`
- `@sendgrid/mail`, `nodemailer`
- `@sentry/nestjs`, `@sentry/node`
- `nestjs-pino`, `pino`, `pino-pretty`

Frontend:

- `react`, `react-dom`, `react-router-dom`
- `@tanstack/react-query`
- `axios`
- `socket.io-client`
- `lucide-react`
- `recharts`
- `localforage`
- `vite-plugin-pwa`, Workbox packages
- `tailwindcss`, `postcss`, `autoprefixer`

Racine:

- Dependances additionnelles: `@google/genai`, `@nestjs/config`, `nestjs-pino`, `pino-http`.

## Problemes detectes en Phase 0

Critiques / bloquants potentiels:

- Tests backend echouent: les specs `tenants` ne fournissent pas `PrismaService`; la spec `payments` ne fournit pas `EmailService` et probablement `NotificationsService`.
- Lint frontend echoue massivement: 2627 problemes dont 2600 erreurs et 27 warnings.
- Le lint analyse aussi `src/.backup-pages`, ce qui gonfle fortement les erreurs et indique que des backups sont inclus dans la base source active.
- Plusieurs fichiers affichent des caracteres mal encodes (`DÃ©pÃ´t`, emojis corrompus, logs `dÃ©marrÃ©`), signe d'un probleme d'encodage historique.
- Workspace Git tres sale: nombreuses modifications et suppressions de migrations Prisma, nombreux fichiers non suivis, scripts de correction, logs et backups.

Majeurs:

- Deux backends/squelettes NestJS coexistent (`backend-depot/src` et `src/`) sans clarification.
- Coexistence de `payments` et `paiement/paiements`, risque de doublon fonctionnel.
- Plusieurs modules metiers ont des noms differents entre frontend et backend (`hotel` vs `hotellerie`, `garage_automobile` vs `garage`, `glacier_snack` vs `glacier`).
- Le frontend a des pages legacy sous `src/pages/*` et des modules modernes sous `src/modules/*`, avec risque de duplication.
- Des scripts de migration/correction restent dans le projet (`fix_schema*.js`, `fix_ts2564*.js`, `update-*.cjs`, backups), a classer avant nettoyage.

Mineurs / dette technique:

- `package.json` racine existe sans scripts projet.
- `frontend-depot/package.json` garde le nom `temp-vite`.
- Lint signale de nombreux imports/variables inutilises, blocs vides et dependances hooks manquantes.
- Plusieurs rapports/logs de build sont versionnes ou presents dans le workspace.

## Verifications executees

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
- Cause principale: providers manquants dans les modules de test NestJS.

Commande:

```bash
cd backend-depot
npx tsc -p tsconfig.json --noEmit
```

Resultat:

- Succes.
- Pas d'erreur TypeScript bloquante avec `--noEmit`.

Commande:

```bash
cd frontend-depot
npm run lint
```

Resultat:

- Echec.
- 2627 problemes detectes.
- 2600 erreurs.
- 27 warnings.
- Categories dominantes: `no-unused-vars`, `no-undef`, `no-empty`, `react-hooks/exhaustive-deps`, `react-hooks/set-state-in-effect`.

## Stabilite avant Phase 1

Statut Phase 0:

- Cartographie terminee.
- Aucun code corrige.
- Tests/verifications executes.
- Le projet n'est pas stable au sens CI: tests backend et lint frontend echouent.
- Le backend compile avec TypeScript `--noEmit`.

Decision recommandee avant Phase 1:

- Passer a la Phase 1 Audit Global sans correction.
- Ne pas corriger les tests/lint maintenant, car cela appartient aux phases d'audit/correction suivantes.
