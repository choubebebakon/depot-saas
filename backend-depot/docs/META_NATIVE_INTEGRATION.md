# Intégration Meta native — GesTock (WhatsApp / Instagram / Messenger)

> Généré dans le cadre du « prompt durci » d'intégration Meta. Le code est
> écrit et validé (8/8 tests backend, `tsc --noEmit` : 0 erreur) ; les points
> qui dépendent du **compte développeur Meta réel** sont explicitement marqués
> « À CONFIRMER » et NE SONT PAS inventés.

## 1. Architecture

```
Frontend (React/Vite, frontend-depot)          Backend (NestJS, backend-depot)
────────────────────────────────────           ─────────────────────────────────
MetaConnectCard                                MetaModule (src/meta/)
  └─ SDK JS Embedded Signup                       ├─ controllers/meta-webhook.controller.ts
       └─ response.authResponse.code ─────────►   │    GET  /api/v1/meta/webhook   (handshake)
          POST /meta/integrations { code }        │    POST /api/v1/meta/webhook   (notifications)
                                                  ├─ controllers/meta-integrations.controller.ts
                                                  │    POST   /api/v1/meta/integrations         (code → onboarding)
                                                  │    GET    /api/v1/meta/integrations         (liste)
                                                  │    GET    /api/v1/meta/integrations/:id/verify
                                                  │    DELETE /api/v1/meta/integrations/:id
                                                  ├─ services/meta-graph-api.service.ts   (Graph API, s2s only)
                                                  ├─ services/meta-integration.service.ts (métier)
                                                  ├─ services/meta-webhook.service.ts     (signature, dédup, file)
                                                  ├─ services/meta-token-crypto.service.ts (AES-256-GCM)
                                                  └─ services/meta-token-guard.service.ts  (cron debug_token)
```

## 2. Flux de connexion (PARTIE 2) — ordre imposé, contrainte n°6

1. Le commerçant clique « Connecter WhatsApp Business » → SDK JS Embedded
   Signup s'ouvre dans le navigateur. **Le code d'autorisation arrive dans le
   callback JS** (`response.authResponse.code`), PAS par une redirection
   serveur (fait vérifié n°1).
2. Le frontend envoie ce code à `POST /api/v1/meta/integrations` (JWT requis,
   rôle PATRON/GERANT). C'est une route d'API classique — **pas** une route de
   redirection Meta.
3. Le backend échange le code **serveur à serveur** contre un access token
   (fait vérifié n°2) — l'App Secret ne quitte jamais le backend.
4. `GET /debug_token` (fait vérifié n°5) : inspection des scopes et WABA
   réellement accordés ; vérification des scopes attendus (fait n°12, y compris
   `whatsapp_business_manage_events`).
5. **Étape 2 de l'onboarding (fait vérifié n°3a)** : enregistrement du numéro
   de téléphone pour l'usage Cloud API (`POST /{phoneNumberId}/register`).
6. **Étape 3 de l'onboarding (fait vérifié n°3b)** : abonnement explicite de
   l'app aux webhooks de CETTE WABA (`POST /{wabaId}/subscribed_apps`). SANS
   CETTE ÉTAPE, aucun message n'arrive, même avec un token valide.
7. Chiffrement **AES-256-GCM** du token (clé `META_TOKEN_ENCRYPTION_KEY`,
   jamais en clair en base — contrainte n°2) puis persistance `MetaIntegration`.

## 3. Webhook Meta unique (PARTIE 3)

- **Handshake GET** (fait vérifié n°6) : `hub.mode=subscribe` + token
  correspondant → `200` avec `hub.challenge` en texte brut ; sinon `403`.
- **Signature sur corps BRUT** (fait vérifié n°7, contrainte n°4) :
  `X-Hub-Signature-256` = HMAC-SHA256 du buffer capturé AVANT tout parsing
  JSON (`req.rawBody` rempli par le `verify` du body-parser de `main.ts`).
  Comparaison en temps constant. `401` sans détail si invalide.
- **Isolation multi-tenant** (fait vérifié n°8, contrainte n°1) : la signature
  prouve l'origine app Meta, PAS le tenant. La résolution `entry.id` →
  `MetaIntegration` (colonnes `phoneNumberId` / `facebookPageId` /
  `instagramPageId` **uniques globalement**) donne le tenant. Canal non résolu
  → événement ignoré + log `META_TENANT_UNRESOLVED` (jamais de cross-tenant).
- **200 immédiat, traitement différé** (fait vérifié n°9, contrainte n°3) :
  Meta relivre en rafale puis désabonne après 1h d'échecs — le handler répond
  200 après signature + dédup, et le traitement (contexte tenant, IA, envoi)
  tourne en file asynchrone (fire-and-forget loggé). File en mémoire
  suffisante mono-process ; passer à BullMQ/Redis en multi-instances.
- **Déduplication** (contrainte n°7) : clé `entryId:messageId` réservée en base
  (`MetaWebhookEvent.eventId` unique, P2002 = doublon ignoré). Testée.

## 4. Supervision & validité du token (PARTIE 4, contrainte n°5)

- Dashboard : statut (Actif/Déconnecté), numéro, canal, expiration, dernière
  vérification, actions « Vérifier » (`debug_token`) et « Révoquer ».
- Cron horaire `MetaTokenGuardService` : `debug_token` sur chaque intégration
  active ; erreur Graph **190** ou `is_valid=false` ou expiration passée →
  `isActive=false` automatique. Les échecs techniques (réseau) ne désactivent
  pas (pas de bascule sur preuve incertaine).

## 5. Variables d'environnement

Backend (`.env` / `.env.example`) :

| Variable | Rôle | Sensibilité |
|---|---|---|
| `META_APP_ID` | ID app Meta | public |
| `META_APP_SECRET` | signature webhooks + app token | **secret** |
| `META_WEBHOOK_VERIFY_TOKEN` | handshake GET webhook | secret partagé |
| `META_TOKEN_ENCRYPTION_KEY` | AES-256-GCM des tokens (64 hex) | **secret critique** — fail closed en prod |
| `META_GRAPH_VERSION` | version Graph API (défaut `v21.0`) | — |
| `META_CONFIG_ID` | template Embedded Signup | — |

Frontend (`frontend-depot/.env`) : `VITE_META_APP_ID`, `VITE_META_CONFIG_ID`
(publics).

## 6. Hypothèses & Points à confirmer

1. **Template Embedded Signup réellement utilisé** (« With 60 Expiration
   Token » vs « Never ») : détermine `tokenExpiresAt` (nullable). Le code lit
   `debug_token.expires_at` et n'invente AUCUNE durée ; la rotation à date
   fixe n'est volontairement PAS codée (fait vérifié n°4). À confirmer dans
   Meta App Dashboard > WhatsApp > Configuration.
2. **Flux combiné ou deux flux ?** (fait vérifié n°10) : le code couvre
   Embedded Signup (WhatsApp/WABA). Pour Instagram DM / Messenger (Pages via
   Facebook Login for Business), les fondations backend existent (colonnes
   `facebookPageId`/`instagramPageId`) mais l'UI ne lance qu'Embedded Signup :
   à étendre si aucun flux combiné n'existe côté Meta.
3. **Version Graph API** : `v21.0` par défaut (`META_GRAPH_VERSION`) — à
   aligner sur la version réellement sélectionnée pour Embedded Signup v4
   (fait vérifié n°11, deadline 15 octobre 2026).
4. **Dépôt frontend** : confirmé — `frontend-depot` est dans le MÊME repo que
   `backend-depot` (React/Vite, react-query, axios `baseURL …/api/v1`).
5. **URL webhook à saisir dans Meta** : `https://<domaine>/api/v1/meta/webhook`
   (préfixe global `api/v1`), avec `META_WEBHOOK_VERIFY_TOKEN` recopié tel quel.
6. **Scopes** : `whatsapp_business_management`, `whatsapp_business_messaging`,
   `whatsapp_business_manage_events` (fait vérifié n°12) + `business_management`
   demandés ; la liste réellement accordée est vérifiée par `debug_token` à la
   connexion (warn log si incomplète — à durcir si besoin).

## 7. Mise en route — checklist opérationnelle

### 7.1 Backend `backend-depot/.env`

| Variable | Valeur à mettre | Où la trouver |
|---|---|---|
| `META_APP_ID` | App ID (public) | Meta App Dashboard > **Settings > Basic** |
| `META_APP_SECRET` | App Secret (**secret**) | Meta App Dashboard > **Settings > Basic** (bouton *Show*) |
| `META_WEBHOOK_VERIFY_TOKEN` | valeur aléatoire déjà générée | à recopier telle quelle dans le dashboard Meta |
| `META_TOKEN_ENCRYPTION_KEY` | 64 hex déjà générés (clé AES-256-GCM) | aucune saisie ailleurs — **ne pas la perdre** |
| `META_GRAPH_VERSION` | `v21.0` (défaut) | à aligner sur la version Graph choisie |
| `META_CONFIG_ID` | ID du template Embedded Signup | Meta App Dashboard > **WhatsApp > Configuration** |

Génération des deux secrets locaux (si absents) :
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

> ⚠️ `META_TOKEN_ENCRYPTION_KEY` : en développement, une clé éphémère est
> générée au démarrage si elle est absente — **tous les jetons déjà chiffrés
> deviennent alors illisibles**. En production, l'absence de cette clé empêche
> le démarrage (fail closed). Garder la clé hors du dépôt Git (`.env` est
> ignoré par Git — vérifier avec `git check-ignore -v backend-depot/.env`).

### 7.2 Frontend `frontend-depot/.env` (valeurs **publiques**)

| Variable | Valeur |
|---|---|
| `VITE_META_APP_ID` | **la même valeur** que `META_APP_ID` |
| `VITE_META_CONFIG_ID` | **la même valeur** que `META_CONFIG_ID` |

Vite injecte ces valeurs **au build** (et au démarrage du serveur de dev) :
après modification, **redémarrer `npm run dev`** / **rebuilder** — sinon
`import.meta.env.VITE_META_APP_ID` reste `undefined` et le SDK ne se charge pas.

### 7.3 Migration base

```bash
cd backend-depot
npx prisma migrate deploy     # applique 20260919090000_meta_native_integration
npx prisma generate           # régénère le client (MetaIntegration, MetaWebhookEvent)
```

Vérification de l'état : `npx prisma migrate status`.

### 7.4 Dashboard Meta (App Dashboard)

1. **Settings > Basic** : renseigner *Privacy Policy URL* et *Terms of Service
   URL* (obligatoire pour publier l'app).
2. **WhatsApp > Configuration** : créer/ouvrir le **template Embedded Signup
   v4** → récupérer son **Config ID** → `VITE_META_CONFIG_ID` /
   `META_CONFIG_ID`. Vérifier le réglage « With 60 Expiration Token » vs
   « Never » (fait vérifié n°4).
3. **WhatsApp > Configuration > Webhook** :
   - **Callback URL** : `https://<votre-domaine-public-https>/api/v1/meta/webhook`
   - **Verify token** : la valeur de `META_WEBHOOK_VERIFY_TOKEN`
   - puis abonner les champs `messages` (et `message_template_status_update`
     si les templates sont utilisés).
   > Meta exige une URL **HTTPS publique**. En local :
   > `npx cloudflared tunnel --url http://localhost:3000` (ou ngrok) et
   > utiliser l'URL fournie + `/api/v1/meta/webhook`.
4. Ajouter les produits **WhatsApp** (Cloud API) — et **Facebook Login for
   Business** uniquement si le flux Pages/Instagram est retenu (fait n°10).

### 7.5 Vérification de bout en bout

1. `npm run start:dev` dans `backend-depot` — au démarrage, aucun
   `META_* missing` ne doit être journalisé.
2. Se connecter au dashboard **en PATRON ou GÉRANT**, ouvrir *Paramètres* →
   carte « Canaux Meta » → **Connecter WhatsApp Business** → le popup Meta
   s'ouvre → choisir le numéro de test.
3. Après succès : une ligne `MetaIntegration` avec `isActive = true`,
   `tokenExpiresAt` non nul si le template expire, et
   `encryptedAccessToken` **non lisible en clair** en base.
4. Envoyer un message WhatsApp au numéro connecté : le webhook reçoit, répond
   200, journalise la résolution du tenant ; les logs `META_TENANT_UNRESOLVED`
   indiquent un canal non rattaché (normal pour un numéro non connecté).
5. Bouton **Vérifier** (dashboard) : appelle `debug_token` et rafraîchit le
   statut ; bouton **Révoquer** : `isActive = false`.

## 8. Dépannage

### 8.1 `Nest can't resolve dependencies of the HttpService (AXIOS_INSTANCE_TOKEN)`

Symptôme exact au boot :

```
ERROR [ExceptionHandler] UnknownDependenciesException [Error]:
Nest can't resolve dependencies of the HttpService (?).
Please make sure that the argument "AXIOS_INSTANCE_TOKEN" at index [0] is
available in the MetaModule module.
```

Cause : `HttpService` est un **provider exporté par `HttpModule`**
(`@nestjs/axios`). Le déclarer dans `providers: [HttpService]` ne crée aucune
instance utilisable — `AXIOS_INSTANCE_TOKEN` n'existe pas.

Correctif (appliqué dans `src/meta/meta.module.ts`) : importer `HttpModule` au
lieu de lister `HttpService` :

```ts
imports: [
  ScheduleModule,
  HttpModule.register({ timeout: 15_000, maxRedirects: 0 }),
],
providers: [
  { provide: META_CONFIG, useFactory: loadMetaConfig },
  MetaTokenCryptoService,
  MetaGraphApiService,
  // …
],
```

Deux garde-fous de sécurité dans ce `register` :

- `timeout: 15_000` — un appel Graph ne doit jamais bloquer le worker qui traite
  les webhooks (fait vérifié n°9 : répondre 200 vite).
- `maxRedirects: 0` — suivre une redirection sortante serait un vecteur
  d'exfiltration de l'access token vers un hôte tiers.

### 8.2 `MetaConfig` (interface) et `@Inject(META_CONFIG)`

`MetaConfig` est une **interface** : avec `emitDecoratorMetadata`, TypeScript
émet `Object` dans `design:paramtypes`, ce que le conteneur Nest ne sait pas
résoudre. Tout consommateur **doit** utiliser le décorateur explicite :

```ts
constructor(
  private readonly http: HttpService,
  @Inject(META_CONFIG) private readonly config: MetaConfig,
) {}
```

C'est le cas dans `MetaGraphApiService`, `MetaIntegrationService`,
`MetaWebhookService` et `MetaTokenGuardService`.

### 8.3 Vérification de non-régression exécutée

| Contrôle | Commande | Résultat |
|---|---|---|
| Typage strict | `npx tsc --noEmit` | 0 erreur (exit 0) |
| Tests unitaires du module | `npx jest src/meta --runInBand` | 16/16 `PASS` (`meta-graph-api`, `meta-webhook`, `meta-token-guard`) |
| Build backend | `npm run build` | Succès (`nest build` code 0) |
| Build frontend | `npm run build` | Succès (`vite build` code 0) |
| Handshake webhook | `GET /api/v1/meta/webhook?hub.mode=subscribe&…` | 200 + `hub.challenge` en texte brut ; **403** si token erroné ; **403** si `hub.mode` absent |
| Signature obligatoire | `POST` sans / avec signature invalide / signature calculée sur un **autre** corps | **401** dans les trois cas (le 3ᵉ cas prouve que le HMAC porte bien sur le **corps brut**, fait n°7) |
| Corps brut unicode | `POST` signé, `"Bonjour \u00e9\u00e0\u00fc"` | **200** `{"received":true}` |
| Déduplication | même événement redélivré | **200** + `meta_webhook_duplicate_ignored: <sourceId>:<messageId>` |
| JSON invalide mais signé | corps tronqué, HMAC correct | **400** |
| Isolation multi-tenant | événement d'un `phone_number_id` inconnu | **200** (jamais d'erreur renvoyée à Meta) + log `META_TENANT_UNRESOLVED : sourceId=… — événement ignoré` |
| Auth dashboard | `GET/POST /integrations`, `GET /integrations/:id/verify` sans JWT | **401** |
| Démarrage avec `.env` réel (`META_APP_SECRET` vide) | `POST` non signé | **401** + `META_APP_SECRET manquant : signature webhook non vérifiable (fail closed)` / `meta_webhook_signature_rejected` |

> **Propriété de sécurité importante** : avec `META_APP_SECRET` vide, le webhook
> renvoie **401**, jamais un 503 « non configuré ». La vérification de signature
> est évaluée **avant** la configuration et avant toute lecture de corps : une
> variable oubliée ne peut donc pas transformer le webhook en point d'entrée
> ouvert. Le 503 n'est levé que par les appels **sortants** Graph
> (`exchangeCodeForToken` / `debugToken`).

> Ces contrôles ont été exécutés contre le backend réellement démarré (base
> PostgreSQL incluse), avec un `META_APP_SECRET` temporaire uniquement le temps
> du test, puis restauré. Aucune donnée de test ne subsiste en base.

### 8.4 Warning de boot `crm_api_key_secret_ephemeral` (module CRM, pas Meta)

Symptôme (log `WARN`, contexte `CrmOmnichannel`) :

```json
{"module":"crm","event":"crm_api_key_secret_ephemeral","detail":
 "CRM_API_KEY_PEPPER non défini : secret éphémère généré pour ce démarrage (développement uniquement)."}
```

Ce warning **ne vient pas du module Meta** : il est émis par `CrmApiKeyService`
(`src/crm/crm-api-key.service.ts`), le module CRM omnicanal préexistant qui
résout `x-api-key` en `tenantId`.

Portée réelle :

| Situation | Conséquence |
|---|---|
| Développement, `CRM_API_KEY_PEPPER` absent | Sel éphémère régénéré à **chaque** démarrage : les clés `CRM_API_KEY_…` créées lors d'un démarrage précédent ne se résolvent plus (`crm_api_key_unknown` → 401). Volontaire et journalisé, jamais silencieux. |
| **Production**, `CRM_API_KEY_PEPPER` absent | `crm_api_key_secret_missing` (ERROR) + toutes les routes `/api/v1/crm` répondent 500 en **fail closed**. |

Correctif — définir un sel stable (32 octets aléatoires) :

```powershell
# PowerShell
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
# ou : openssl rand -hex 32
```

```ini
CRM_API_KEY_PEPPER=<64 caractères hexadécimaux, stable dans le temps>
CRM_LOG_SUBJECT_SALT=<64 caractères hexadécimaux>   # optionnel : sinon CRM_API_KEY_PEPPER est réutilisé
```

Ces deux variables sont **indépendantes** des variables `META_*` : les confondre
n'est pas possible (sel de hachage de clés d'API ≠ App Secret Meta). Le warning
disparaît au redémarrage suivant, et les routes `/api/v1/meta/*` ne sont pas
concernées.

> Ordre d'évaluation à retenir : `crm_meta_secret_missing` (ERROR) n'apparaît que
> si `META_WEBHOOK_SIGNATURE_MODE=required` **et** `META_APP_SECRET` vide. Avec la
> valeur par défaut `optional`, l'absence de `META_APP_SECRET` n'empêche pas le
> boot, mais le webhook Meta natif (`/api/v1/meta/webhook`) reste en **401
> fail closed** tant que l'App Secret n'est pas renseigné (fait n°7).
