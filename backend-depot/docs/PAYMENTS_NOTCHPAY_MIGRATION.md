# Migration paiements — agrégateur unique NotchPay (décommissionnement Stripe & Campay)

> Document généré dans le cadre du « prompt durci » de consolidation du paiement
> d'abonnement GesTock. Il fait autorité pour l'ordre des opérations de
> décommissionnement. **Règle d'or : aucune suppression avant confirmation.**

---

## FAITS VALIDÉS EN CONDITIONS RÉELLES (compte NotchPay LIVE GesTock)

> Confirmés par tests réels et le support NotchPay. Ils remplacent toutes les
> hypothèses antérieures et sont intégrés au code :

1. **Authentification à deux mécanismes distincts** : la clé **publique** va dans
   `Authorization` et suffit pour tous les endpoints de paiement standard
   (`/payments/initialize` → 201 validé en LIVE). La clé **privée** va dans le
   header séparé `X-Grant`, uniquement pour les endpoints à risque (transferts).
   L'envoi de la clé privée dans `Authorization` provoque le 401 « Invalid API
   credentials » — cause racine de l'erreur 500 historique sur `/payments/init`,
   corrigée dans `notchpay.service.ts`.
2. **Format des clés** : elles contiennent un point littéral (`pk.`, `sk.`, `hsk.`).
3. **Événements webhook réels** (orthographe exacte, depuis le dashboard) :
   `payment.created`, `payment.processing`, `payment.complete`, `payment.partially_pay`,
   `payment.failed`, `payment.cancelled` (deux L), `payment.expired`,
   `payment.authorized`, `payment.captured`. **`payment.success` n'existe pas.**
   Aucun événement `subscription.*` n'existe → le renouvellement reste propre à GesTock.
4. **`payment.expired` existe nativement** → source principale de la gestion
   d'expiration (contrainte 12) ; le cron de secours reste en profondeur de défense.
5. **Aucun réglage pays dans le dashboard** : la disponibilité dépend uniquement des
   canaux activés sur le compte (confirmé par le support NotchPay).
6. **`GET /channels`** (avec la clé publique) = référence réelle de couverture, avec
   IDs (`cm.mtn`, `cm.orange`), statuts `active`/`live` et limites min/max.
   **`GET /countries` ne doit JAMAIS servir de référence** (liste mondiale sans lien).
7. **Secret webhook** : à confirmer à la création de l'endpoint (peut différer de
   `NOTCHPAY_HASH_KEY`).
8. **Contexte webhook** : choisir « Votre compte » (pas « Événements de facturation »).
9. **DNS Windows/Node 18+** : `getaddrinfo ENOTFOUND` possible → contournement
   `NODE_OPTIONS=--dns-result-order=ipv4first` (à ne généraliser qu'après vérif prod).
10. **AUCUN SDK JavaScript navigateur n'existe** chez NotchPay. Le flux officiel
   est « **Collect** » (page de paiement HÉBERGÉE) : `POST /payments` côté serveur
   puis `window.location.href = data.authorization_url`. L'ancien code chargeait
   `https://checkout.notchpay.co/script.js` → **ERR_CONNECTION_RESET** constaté en
   réel ; cet hôte ne pointe même pas sur l'infrastructure NotchPay (`api.` et
   `pay.` = 148.113.235.168, `checkout.` = 78.141.199.93). **Supprimé**.
11. **Champ de réponse réel = `authorization_url`** (vérifié en LIVE, HTTP 201) :
   `{ status, message, code, transaction: { reference: 'trx.…', trxref: 'GST-…',
   status: 'pending' }, authorization_url }`. **`checkout_url` n'existe pas** →
   le repli frontend échouait silencieusement. L'identifiant NotchPay à stocker
   est **`transaction.reference`** (préfixe `trx.`) ; `transaction.id` n'existe pas.
12. **Le champ `channel` n'est pas documenté** (OpenAPI 2.1.0) : il est ignoré.
   Pour honorer le choix du commerçant il faut **`locked_channel`** (ex. `cm.mtn`),
   accompagné de **`locked_country`** (`CM`) et **`locked_currency`** (`XAF`).
   Vérifié : avec `locked_currency`, la réponse renvoie `locked_currency: "XAF"`.
13. **`callback`** (facultatif) = URL de retour après paiement ; NotchPay redirige
   avec `?reference=trx.…&status=…&trxref=<notre référence>`. Exposé via
   `NOTCHPAY_CALLBACK_URL` (vide par défaut → page de résultat NotchPay).
14. **Statuts de transaction documentés** : `pending`, `processing`, `incomplete`,
   `canceled` (**un seul L** en statut), `failed`, `rejected`, `abandoned`,
   `expired` (après **3 h**), `complete`, `refunded`, `partialy-refunded`.
   ⚠️ Ne pas confondre avec le nom d'ÉVÉNEMENT webhook `payment.cancelled`
   (deux L) — les deux orthographes coexistent dans l'écosystème NotchPay.
15. **`GET /payments/{reference}`** est bien documenté (« Retrieve a payment ») :
   le mécanisme de rattrapage *pull* du cron est légitime et non spéculatif.
16. **INCIDENT MESURÉ — `locked_channel` rend la page de paiement inutilisable.**
   Sonde réelle (5 paiements de 1 000 XAF créés, puis page hébergée récupérée) :

   | Variante | `phone` | `locked_channel` | Page liste MTN/Orange ? |
   |---|---|---|---|
   | A | oui | — | **oui** |
   | E | non | `cm.mtn` | non |
   | G | non | `cm.orange` | non |
   | H | oui | `cm.orange` | non |
   | C (= ancien code) | oui | `cm.mtn` | non |

   → Le verrou **est bien appliqué** par NotchPay (le contenu de la page change),
   mais le parcours « collect verrouillé » n'est pas opérationnel sur ce compte :
   la page affiche « **Méthode de paiement indisponible** », **pour MTN comme
   pour Orange**, avec ou sans `phone`.
   → **Décision appliquée** : verrou désactivé par défaut
   (`NOTCHPAY_LOCK_CHANNEL=false`). La page Collect propose alors les canaux
   réellement actifs du compte (MTN MoMo + Orange Money CM) et le commerçant y
   choisit sa méthode. `locked_currency` reste envoyé (accepté, reflété dans la
   réponse) ; `locked_country` n'est **pas reflété** et n'a produit **aucun effet
   observable** → envoyé uniquement si le verrou est activé.
   → **À clarifier avec le support NotchPay** : pourquoi le collect verrouillé
   échoue-t-il alors que `/channels` déclare `cm.mtn`/`cm.orange`
   `active: true, live: true, collect: 1` ? Vérifier aussi que le compte est
   habilité LIVE pour l'encaissement (vérification business terminée).
17. **POLITIQUE D'ÉCHEC APPLIQUÉE** (transitoire vs définitif) — module
   `src/payments/notchpay-failure-policy.ts` (+ spec) :
   - **Classification** par code HTTP + message brut : `TRANSIENT`
     (500/502/503/504/429/408, « Service Unavailable », timeout, réseau,
     indisponibilité), `INVALID_NUMBER` (numéro/format invalide — définitif),
     `INSUFFICIENT_FUNDS` (solde insuffisant — définitif), `ABANDONED`
     (cancelled/expired sans validation — définitif), `UNKNOWN` (neutre).
   - **Retry automatique** avec backoff croissant (0.5 s / 1.5 s / 4 s, ~6 s max)
     pour les SEULS échecs TRANSITOIRES, avant de remonter quoi que ce soit ;
     les échecs définitifs remontent immédiatement.
   - **Messages marchands dédiés** (jamais le brut NotchPay, qui reste en logs
     serveur) : transitoire → « Le service mobile money semble temporairement
     indisponible. Merci de réessayer dans quelques minutes. » ; numéro
     invalide → « Le numéro saisi ne semble pas valide pour ce moyen de
     paiement. Vérifiez-le et réessayez. » ; solde insuffisant → « Le paiement
     a été refusé, probablement en raison d'un solde insuffisant sur le compte
     mobile money. » ; annulé/expiré → « Le paiement n'a pas été finalisé à
     temps. Vous pouvez réessayer quand vous êtes prêt. » ; non catégorisé →
     message neutre + réessai/support.
   - **Codes HTTP renvoyés au frontend** : 503 (transitoire épuisé), 400
     (numéro invalide / solde insuffisant / non finalisé), 502 (provider non
     catégorisé), 500 (clés invalides). Le champ `details` (qui exposait
     autrefois le brut) a été supprimé de la réponse.



**Couverture réelle** (réponse `GET /channels` archivée :
`backend-depot/notchpay-channels-raw.json`) :
- `cm.mtn` et `cm.orange` : **actifs** (`active=true`, `live=true`), CM, XAF,
  min **10** / max **500 000 XAF** par transaction ;
- canal **`card` (Visa/Mastercard) : INACTIF** sur le compte (`active=false`,
  `live=false`) → **paiements carte refusés fail-closed** tant que le canal n'est
  pas activé côté NotchPay. Frontend : tuiles Visa/Mastercard et badges carte
  masqués automatiquement (`PricingPage.jsx` + `notchpayCountries.js`) ;
  réactivation = un seul point à modifier (`notchpay-channels.config.ts` + miroir
  frontend), tout s'affiche de nouveau.

---

## PARTIE 0 — Cartographie de l'existant (état réel du code, vérifié)

### 0.1 Ce qui existe pour chaque étape du parcours cible

| Étape du parcours cible | État actuel (code vérifié) | Verdict |
|---|---|---|
| 1. Sélection méthode (MoMo / Orange / carte) | `PricingPage.jsx` — modale 2 étapes ; `PAYMENT_METHODS` inclut encore STRIPE (à retirer, fait) | ⚠️ corrigé en PARTIE 4 |
| 2. Formulaire pays + numéro/carte | Numéro seul, regex CM codée en dur dans les DTOs ; pas de sélecteur pays | ⚠️ remplacé par config centralisée (PARTIE 2) |
| 3. Push USSD (code secret) | Le texte du push est **généré par l'opérateur** ; rien dans le SDK NotchPay inline (`notchpayCheckout.ts`) ni dans l'API ne permet de le personnaliser → **à confirmer** (voir 0.5) | ❌ non paramétrable à ce stade |
| 4. Confirmation + activation par webhook | `POST /billing/webhook` + `POST /payments/notchpay/webhook` (signature HMAC obligatoire, rawBody) → `BillingService.handleWebhook` → idempotence `BillingWebhookEvent` → `PaymentsService.handleWebhookNotification` | ✅ renforcé en PARTIE 5 |

### 0.2 Carte des endpoints (avant consolidation)

| Route | Contrôleur | Auth | Rôle actuel | Décision |
|---|---|---|---|---|
| `POST /payments/init` | `PaymentsController` | JWT | Création ligne `Payment` PENDING + init NotchPay (`createPendingPayment`) | **Gardé** — contexte utilisateur authentifié |
| `POST /billing/initialize` | `BillingController` | JWT + permission `abonnement:write` | Quote prorata (`PlanChangeService`) **puis** le même `createPendingPayment` | **Gardé** — apporte le calcul prorata/upgrade-downgrade ; justifié par le contexte (cf. 0.3) |
| `POST /payments/initialize` | `PaymentsController` | **Public** | Site Vitrine (sans ligne Payment, activation par méta tenantId/plan) | **Gardé** — flux public distinct, documenté en repli |
| `POST /billing/webhook` | `BillingController` | Guard HMAC (`NotchPayWebhookGuard`) | Webhook NotchPay canonique | **Gardé — chemin principal** |
| `POST /payments/notchpay/webhook` | `NotchPayWebhookController` | Signature vérifiée inline | Doublon du précédent (même `BillingService.handleWebhook`) | **À fusionner** — voir 0.3 |
| `POST /payments/webhook` | `PaymentWebhookController` | Signature vérifiée inline | Webhook NotchPay « legacy » (metadata.paymentId) | **Déprécié** — à retirer après confirmation de la config webhook du dashboard NotchPay |
| `POST /payments/webhooks/campay` + `POST /payments/webhooks/stripe` | dédiés | HMAC Stripe / Campay | Webhooks des agrégateurs décommissionnés | **Période de grâce** — voir PARTIE 1 |
| `POST /payments/webhook` (dans `PaymentsController`) et `POST /payments/webhooks/campay` (doublon) | `PaymentsController` | Signature (optionnelle !) | **Doublons** de `PaymentWebhookController`/`CampayWebhookController` | ⚠️ Le endpoint `PaymentsController.handleWebhook` vérifie la signature **seulement si fournie** — à neutraliser en phase de grâce (voir checklist) |


### 0.3 Justification des 3 endpoints d'initialisation (contrainte 6)

- `/payments/init` (JWT) : crée la ligne `Payment` et appelle NotchPay. C'est le
  chemin utilisé par la PricingPage pour un tenant déjà authentifié.
- `/billing/initialize` (JWT + permission) : réutilise **exactement** le même
  service (`PaymentsService.createPendingPayment`) mais ajoute le devis
  prorata upgrade/downgrade (`PlanChangeService.quotePlanChange`) et le champ
  `chargeAmount` personnalisé. La fusion réelle en un seul endpoint est notée
  « à faire après stabilisation » dans la checklist, car elle change le contrat
  public de l'API ; aujourd'hui **un seul service sous-jacent** (déjà le cas).
- `/payments/initialize` (public) : Site Vitrine — pas de JWT (prospect non
  authentifié), pas de ligne `Payment` (activation par métadonnées). Contexte
  d'authentification réellement différent : **justifié de rester**.

### 0.4 Idempotence : rôles clarifiés (contrainte 7)

- **`BillingWebhookEvent`** = idempotence **événement** (niveau webhook) :
  réservation atomique par `eventKey` (= id transaction NotchPay) AVANT
  traitement, race-safe (`P2002`). Garde-fou contre les retries NotchPay.
- **`operatorTxId`** (colonne `Payment`, unique) = trace de la transaction
  **opérateur** (id MTN/Orange) stockée à la confirmation. Historiquement
  partagé avec Campay ; sert désormais d'audit — la déduplication canonique
  reste `BillingWebhookEvent`. ⚠️ Relevé en PARTIE 0 : `markPaymentSuccess`
  écrit `operatorTxId` pour chaque provider ; l'unicité pourrait entrer en
  collision sur des replays multi-providers historiques — surveiller les
  erreurs `P2002` au cron de reconciliation.
- **Les deux restent**, avec des rôles distincts et documentés (webhook-level
  vs payment-level). Fusion = perte d'information d'audit, refusée.

### 0.5 Points NON confirmés (à trancher avant toute suppression)

1. **Couverture NotchPay du compte GesTock** (dashboard inaccessible depuis ce
   dépôt) : Orange Money CM et MTN MoMo CM sont confirmés **par le code en
   production** ; la couverture **cartes internationales** (ex-Stripe) et
   **tout autre pays** ne sont PAS confirmées → décision produit à trancher
   explicitement. Tant que ce point n'est pas tranché, la config centralisée
   (`src/common/config/notchpay-channels.config.ts`) ne liste que le CM et
   fail-close tous les autres.
2. **Texte du push USSD** : rien dans le SDK inline ou l'API d'initialize ne
   permet de le personnaliser. Hypothèse prudente : non personnalisable
   (généré par l'opérateur). La copy frontend est honnête sur ce point (PARTIE 4).
3. **Paiements PENDING / STRIPE / Campay en vol** : vérifiables uniquement en
   production :
   ```sql
   SELECT id, method, status, reference, "createdAt" FROM "Payment"
   WHERE status = 'PENDING' AND "createdAt" > now() - interval '7 days';
   SELECT count(*) FROM "Payment" WHERE status = 'COMPLETED';  -- impact migration
   SELECT count(*) FROM "Payment" WHERE method = 'STRIPE' AND status = 'PENDING';
   ```
   **Aucun retrait de webhook ne doit être exécuté avant que la première
   requête ne renvoie 0 ligne (ou après expiration naturelle via le cron).**
4. **Calcul HT/TTC annuel** : deux implémentations coexistent —
   `subscription-pricing.config.ts` (remise -17 % annuelle, source de vérité du
   module Billing) vs `calculateAmount` dans `payments.service.ts` (249 000 /
   498 000 / 996 000 en dur). À unifier : `calculateAmount` doit déléguer à
   `calculatePlanAmount` (checklist §7.6).
5. **Dunning** : `processDunning()` est appelé par le CRON minuit
   (`SubscriptionLifecycleService.runNightlyLifecycle`) ; `notchpayCustomerId`
   n'est utilisé **nulle part** (marqué « futur usage récurrent ») — le dunning
   actuel est donc **sans re-prélèvement NotchPay** (emails + PAST_DUE
   uniquement). À confirmer si un prélèvement récurrent doit être câblé.

---

---

## PARTIE 1 — Décommissionnement Stripe & Campay : plan par étapes

> Phases exécutées dans ce dépôt : **phase 1** (blocage création) + documentation.
> Les phases 2 et 3 sont des opérations **de production** — elles ne doivent être
> exécutées qu'après les vérifications SQL de 0.5.3.

### Phase 1 — Désactivation de la création de nouveaux paiements (FAIT)

| # | Action | Fichier | État |
|---|---|---|---|
| 1.1 | Refus de toute création `method=STRIPE` en couche service (aucune route supprimée) | `payments.service.ts` (`createPendingPayment`) | ✅ fait |
| 1.2 | DTOs : `STRIPE` retiré des méthodes acceptées (`IsIn` sur `NOTCHPAY_PAYMENT_METHODS`) | `initialize-billing.dto.ts`, `create-payment.dto.ts` | ✅ fait |
| 1.3 | Frontend : tuile + option STRIPE retirées de la modale de paiement | `PricingPage.jsx` | ✅ fait |
| 1.4 | Enum `PaymentMethod.STRIPE` **conservé** + `@deprecated` documenté (contrainte 4) | `schema.prisma` | ✅ fait |
| 1.5 | Branche morte Stripe frontend (`stripeClientSecret` → `/payment-card`) retirée | `PricingPage.jsx` | ✅ fait |

**Note Campay** : `CampayService.collect()` n'était déjà plus appelé par aucun
flux de création (vérifié PARTIE 0) — Campay ne servait plus qu'à la
reconciliation des PENDING (`TasksService`, `AdminService`). Aucune création à
bloquer côté Campay.

### Phase 2 — Période de grâce Campay (webhook maintenu)

1. **Pré-requis bloquant** : requête SQL 0.5.3 — zéro `PENDING` Campay
   (`method=MTN_MOMO AND status=PENDING AND operatorTxId IS NOT NULL`).
2. Maintenir `POST /payments/webhooks/campay` (signature HMAC) et le cron de
   reconciliation 2h00 jusqu'à expiration des paiements en vol.
3. **Neutraliser le doublon non signé** `POST /payments/webhooks/campay` de
   `PaymentsController` (signature optionnelle = fail-open) — à faire dès la
   phase 2.
4. **⛔ POINT DE NON-RETOUR n°1** : retrait de `CampayWebhookController` +
   `campay.service.ts` + dépendance de reconciliation dans `TasksService` /
   `AdminService` + variables `CAMPAY_APP_USERNAME`, `CAMPAY_APP_PASSWORD`,
   `CAMPAY_WEBHOOK_SECRET`. Après ce point, un paiement Campay en vol ne peut
   plus jamais être confirmé — vérifier 2 fois le SQL avant.

### Phase 3 — Période de grâce Stripe (webhook maintenu)

1. **Pré-requis bloquant** : zéro `Payment` `method=STRIPE` en `PENDING`
   (SQL 0.5.3). NB : la création Stripe est déjà morte en amont depuis
   longtemps (`createPaymentIntent` n'est appelé nulle part), donc aucun
   paiement Stripe « en vol » n'est théoriquement possible — la vérification
   SQL reste obligatoire pour trancher.
2. Maintenir `POST /payments/webhooks/stripe` (signature Stripe stricte) pour
   les webhooks Stripe en vol éventuels.
3. **⛔ POINT DE NON-RETOUR n°2** : retrait de `StripeWebhookController`,
   `stripe.service.ts`, `stripePaymentIntentId` (lecture seule conservée dans
   les données historiques — la colonne reste, seul son usage code disparaît),
   dépendance npm `stripe` et variables `STRIPE_SECRET_KEY`,
   `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`.
4. Retirer `stripe` de `package.json` : `npm uninstall stripe` — **uniquement
   après** le point 3.

### Phase 4 — Nettoyage final (après les 2 points de non-retour)

- Retirer les webhooks legacy NotchPay redondants (`/payments/webhook` et
  `/payments/notchpay/webhook`, après confirmation de l'URL configurée dans le
  dashboard NotchPay — ne garder QUE `/billing/webhook`).
- Retirer `@nest/module` doublons et mettre à jour `BILLING_SPEC.md`.
- Ne jamais réutiliser `PaymentMethod.STRIPE` ; toute nouvelle carte passe par
  `VISA_CARD`/`MASTERCARD` via NotchPay.

---

---

## PARTIE 2 — Config centralisée pays / devises / canaux (NotchPay uniquement)

### 2.1 Source de vérité

| Fichier | Rôle |
|---|---|
| `backend-depot/src/common/config/notchpay-channels.config.ts` | **Source de vérité backend** : pays, devise, indicatif, regex téléphone, canaux, niveau de confirmation, helpers (`getCountryCoverage`, `isChannelSupported`, `isPaymentMethodAllowed`, `validateMomoPhoneForCountry`, `normalizeMomoPhoneForCountry`). |
| `frontend-depot/src/config/notchpayCountries.js` | **Miroir frontend** : même contenu (JS), consommé par le sélecteur de pays et la validation du formulaire. |

> ⚠️ **Contrat de synchronisation** : toute modification de couverture réelle doit
> être répercutée dans **les deux** fichiers. Un écart provoque soit une méthode
> proposée par le frontend puis refusée par le backend (fail-closed), soit un pays
> masqué côté UI alors que l'API l'accepte.

### 2.2 Couverture réellement déclarée (fail-closed)

| Pays | Devise | Canaux | Niveau de confirmation |
|---|---|---|---|
| CM — Cameroun | XAF | `mtn` (MTN_MOMO), `orange` (ORANGE_MONEY), `card` (VISA_CARD, MASTERCARD) | `CODE_CONFIRMED` (prouvé par le code de production) |

- **Aucun autre pays n'est listé.** Un pays non listé est **refusé**
  (`getCountryCoverage` → `undefined`, `isPaymentMethodAllowed` → `false`).
- `NOTCHPAY_PAYMENT_METHODS` **exclut volontairement `STRIPE`** : l'enum Prisma
  conserve la valeur pour l'historique, mais aucun nouveau paiement ne peut la
  référencer (contrainte 4).
- La couverture **cartes internationales** (ex-Stripe) est marquée **à confirmer**
  (voir PARTIE 6 « Hypothèses »). Elle est déclarée sur le canal `card` parce que
  c'est le canal technique NotchPay ; la portée internationale commerciale reste
  une décision produit non tranchée.

### 2.3 Validation avant suppression (rappel bloquant)

Rien de Stripe/Campay ne doit être supprimé avant que la question « NotchPay
couvre-t-il les pays/canaux ex-Stripe/ex-Campay sur le compte GesTock ? » soit
tranchée explicitement. Tant qu'elle ne l'est pas, **seule la phase 1 (blocage de
création) est légitime** — les phases 2 et 3 restent conditionnées aux requêtes
SQL de 0.5.3.


---

## PARTIE 3 — Backend : consolidation

### 3.1 Statut de paiement canonique (contrainte 5)

| Élément | Décision |
|---|---|
| Fichier créé | `src/common/utils/payment-status.utils.ts` |
| Statut canonique | `PaymentStatus.SUCCESS` (`CANONICAL_SUCCESS_STATUS`) |
| Statut déprécié | `PaymentStatus.COMPLETED` — **jamais écrit** par le code actif, seulement lu et réinterprété |
| Garde d'idempotence | `canTransitionTo(current, target)` — refuse toute mutation depuis un statut terminal, autorise le succès → `REFUNDED` uniquement |
| Migration SQL | `prisma/migrations/20260917000000_canonicalize_payment_status/migration.sql` — réaffecte les lignes `COMPLETED` → `SUCCESS` (données historiques conservées, aucune suppression) |

- L'enum Postgres **conserve les deux valeurs** (contrainte 4/5) : supprimer une
  valeur d'enum référencée par des lignes est impossible proprement, et la
  réécriture de l'historique est interdite. `COMPLETED` est documenté
  `@deprecated` dans `schema.prisma`.
- Toute lecture applicative doit passer par `canonicalizePaymentStatus()` pour
  éviter deux représentations du même état.

### 3.2 Endpoints d'initialisation (contrainte 6)

**Décision : conserver 3 endpoints, aucun n'est un doublon de routage.**

| Endpoint | Contexte d'authentification | Justification de maintien |
|---|---|---|
| `POST /payments/init` | JWT (`JwtAuthGuard`) + `@CurrentUser()` | Chemin principal du commerçant authentifié (PricingPage). `tenantId` déduit du token, jamais du body → **non falsifiable**. |
| `POST /billing/initialize` | JWT + permission `abonnement:write` | Ajoute le **devis prorata** upgrade/downgrade (`PlanChangeService.quotePlanChange`) et `chargeAmount`. Sous le capot : le **même** `PaymentsService.createPendingPayment`. Contexte d'autorisation différent (permission métier). |
| `POST /payments/initialize` | **Public** (`@Public()`, throttle 10/min) | Site Vitrine : prospect non authentifié, **pas de ligne `Payment`** (activation par métadonnées). Contexte réellement différent. |

Consolidation obtenue sans casser le contrat public : **un seul chemin
d'initialisation de paiement sous-jacent** (`PaymentsService` +
`NotchPayService.initializePayment`). Les 3 routes ne diffèrent que par
l'authentification et le calcul de montant. La fusion en une URL unique
changerait le contrat d'API public (Site Vitrine) sans bénéfice de sécurité →
**refusée, documentée**.

### 3.3 Idempotence (contrainte 7)

Deux mécanismes **complémentaires, de niveaux différents** — pas de fusion :

| Mécanisme | Niveau | Rôle |
|---|---|---|
| `BillingWebhookEvent` (`WebhookIdempotencyService`) | **Événement webhook** | Réservation atomique par `eventKey` (= id transaction NotchPay) **avant** traitement ; `P2002` = déjà traité → no-op. Protège des retries NotchPay. |
| `Payment.operatorTxId` (unique) | **Transaction opérateur** | Trace d'audit de l'id MTN/Orange écrit à la confirmation. Historiquement partagé avec Campay — conservé en lecture. |

Superposé à cela : `canTransitionTo()` (PARTIE 3.1) en défense en profondeur
côté `Payment` — un replay ne peut ni re-prolonger l'abonnement, ni écraser un
remboursement, même si l'événement webhook passe l'idempotence.

⚠️ Point de vigilance documenté : `operatorTxId` est `@unique` ; des replays
multi-providers historiques (Campay → NotchPay sur le même paiement) pourraient
provoquer un `P2002`. À surveiller dans les logs du cron de reconciliation ; ne
pas « corriger » en supprimant la contrainte (perte de traçabilité).

### 3.4 Validation téléphone (contrainte 8)

| Avant | Après |
|---|---|
| Regex Cameroun-only en dur dans les DTOs (`^2376\d{8}$`) | `@MomoPhoneByCountry()` (`src/common/validators/momo-phone.constraint.ts`) → délègue à `validateMomoPhoneForCountry(country, phone)` de la config centralisée |

- `CreatePaymentDto` et `InitializeBillingDto` acceptent un champ `country`
  (ISO 3166-1 alpha-2, `@Transform` → uppercase), optionnel, défaut `CM`.
- **Fail-closed** : pays non couvert → validation refusée (aucune exception
  « on suppose que c'est couvert »).
- Normalisation : `normalizeMomoPhoneForCountry()` préfixe l'indicatif du pays
  configuré (chiffres purs, sans `+`) — sert à la validation et au transport
  frontend → backend.
- **Format envoyé à NotchPay (fait validé par le support NotchPay, 2026-09)** :
  E.164 strict AVEC `+`, unifié pour tous les pays via
  `toE164MomoPhone(country, phone)` (`notchpay-channels.config.ts`) appelé
  dans `PaymentsService.createPendingPayment` — Cameroun : `+2376XXXXXXXX`
  (ex. `+237670000000`), autres pays couverts : `+<indicatif><national>`.
  L'ancien double chemin (CM legacy `normalizePhone` / autres pays sans `+`)
  a été remplacé par ce format unique, fail-closed (pays non couvert ou
  numéro vide → aucun champ `phone` envoyé).


---

## PARTIE 4 — Frontend : formulaire de paiement du commerçant

### 4.1 Fichiers touchés / créés

| Fichier | État | Nature de la modification |
|---|---|---|
| `frontend-depot/src/config/notchpayCountries.js` | **Créé** | Miroir JS de la config centralisée backend (pays, devise, indicatif, regex, placeholder, canaux) + helpers `getCountryCoverage`, `isChannelSupported`, `normalizeMomoPhoneForCountry`, `validateMomoPhoneForCountry`. |
| `frontend-depot/src/pages/PricingPage.jsx` | Modifié | Suppression de Stripe (import logo, tuile, entrée `NOTCHPAY_CHANNELS`, branche morte `stripeClientSecret` → `/payment-card`, badge de confiance) ; ajout du sélecteur de pays ; validation par config ; copy USSD honnête ; état d'attente. |
| `frontend-depot/src/assets/stripe.svg` | **Conservé (à retirer en phase 4)** | Plus référencé par aucun fichier source. Suppression volontairement différée : aucun impact paiement, mais le nettoyage d'assets appartient à la phase de nettoyage final. |

### 4.2 Parcours implémenté (modale existante étendue, pas reconstruite)

1. **Sélection méthode** — tuiles Mobile Money (`MTN_MOMO`, `ORANGE_MONEY`) et
   Carte (`VISA_CARD`, `MASTERCARD`), **filtrées par `methodsForCountry(CM)`**
   (config centralisée). La tuile Stripe a disparu.
2. **Formulaire compact** — `Pays de paiement` (sélecteur construit depuis
   `NOTCHPAY_COUNTRIES`) + `Numéro <méthode>` ; le placeholder et la regex de
   bordure proviennent de la config (`phonePlaceholder`, `phoneRegex`).
   Le pays est envoyé au backend (`country`) et le numéro normalisé par
   `normalizeMomoPhoneForCountry` (plus de `'237'` en dur).
3. **État d'attente** — remplacé par le **moniteur push Mobile Money**
   (PARTIE 7) : au retour depuis la page hébergée NotchPay, un écran affiche
   un décompte de 2 min 30 invitant le commerçant à vérifier son téléphone,
   un bouton de relance (même canal) passé le délai, et une instruction de
   secours spécifique à l'opérateur — uniquement après le délai. **Aucune
   attente bloquante côté serveur** (contrainte 12) : la confirmation arrive
   par webhook (le moniteur ne fait que scruter le statut en lecture seule).
4. **Succès / échec** — `onSuccess` NotchPay affiche un message **honnête** :
   *« Paiement reçu. L'abonnement s'active dès la confirmation de l'agrégateur
   (quelques instants). »* → l'activation réelle est pilotée **par le webhook
   signé**, jamais par l'état client (contrainte 9). L'état client n'est qu'une
   conséquence UX (redirection onboarding).

### 4.3 Copy honnête sur le push USSD (contrainte 13)

Texte affiché sous le champ numéro :

> « Un message de validation sera envoyé sur ce numéro par votre opérateur.
> Saisissez le code confidentiel reçu pour confirmer le paiement. Le libellé
> exact du message est défini par l'opérateur. »

Aucune promesse de libellé exact : rien dans le SDK inline
(`frontend-depot/src/api/notchpayCheckout.ts`) ni dans l'API d'initialisation ne
permet de personnaliser ce texte → **hypothèse prudente : non personnalisable**.
À confirmer auprès de NotchPay (PARTIE 6).

### 4.4 Sécurité (contrainte 11)

- Aucun secret backend exposé : seule la **clé publique** NotchPay (nécessaire au
  SDK inline) transite dans la réponse `checkout.publicKey`.
- Les garde-fous frontend (`methodsForCountry`, `validateMomoPhoneForCountry`)
  sont **purement UX** — le backend revalide tout (DTO + config centralisée).
  Commentaire explicite dans le code pour éviter toute confusion.
- Le pays et le numéro sont validés côté serveur ; le `tenantId` n'est jamais
  envoyé par le client sur `/payments/init` (déduit du JWT).


---

## PARTIE 5 — Activation d'abonnement (pilotée serveur, idempotente)

### 5.1 Chaîne d'activation canonique

```
NotchPay ──(HMAC sha256 sur rawBody)──► POST /billing/webhook
                                          │ NotchPayWebhookGuard (rejet 401 si signature absente/invalide)
                                          ▼
                            BillingService.handleWebhook(payload)
                                          │ WebhookIdempotencyService.reserve(eventKey) → P2002 = ALREADY_PROCESSED
                                          ▼
                       PaymentsService.handleWebhookNotification(payload)
                                          │ recherche Payment par reference / notchPayId
                                          ▼
                       PaymentsService.markNotchPayComplete()  ← canTransitionTo() (garde idempotence)
                                          ▼
                       PaymentsService.markPaymentSuccess()
                                          │ re-lecture du statut AVANT mutation (anti replay)
                                          ▼
                       Tenant { subscriptionStatus: ACTIVE, statutAbonnement: ACTIVE,
                                planType, dateExpiration +1 mois/+1 an selon billingCycle,
                                subscriptionEnd, currentPeriodEnd, estActif: true,
                                graceUntil: null, paymentRetryCount: 0 }
```

### 5.2 Garanties vérifiées par le code

| Garantie | Implémentation |
|---|---|
| **Déclencheur unique = webhook signé** (contrainte 9) | L'activation n'est écrite que dans `markPaymentSuccess`, appelé uniquement depuis `markNotchPayComplete` ← `handleWebhookNotification` / `PaymentWebhookController`. Aucune route HTTP « activer » n'existe. Le frontend ne fait que rediriger. |
| **Vérification de signature non contournable** (contrainte 11) | `NotchPayWebhookGuard` sur `/billing/webhook` (throw 401 si `rawBody` ou signature manquants) et vérification inline dans les contrôleurs legacy. `rawBody` capturé par `express.json({ verify })` dans `main.ts` → le HMAC porte sur les octets exacts reçus. |
| **Idempotence stricte** (contrainte 10) | 3 couches : `BillingWebhookEvent` (événement) → `canTransitionTo` (statut) → re-lecture du statut dans `markPaymentSuccess` avant update. Un replay ne re-prolonge jamais `dateExpiration` et ne renvoie pas de second email. |
| **Statut courant vérifié avant mutation** | `markPaymentSuccess` lit `payment.status` ; si déjà `SUCCESS`/`COMPLETED`/`REFUNDED` → `no-op` + log `[Idempotence]`. |
| **Pas de `PENDING` éternel** (contrainte 12) | Cron quotidien (Africa/Douala) : `TasksService` bascule les `PENDING` expirés en `FAILED` + reconciliation des transactions opérateur. Aucune attente bloquante dans la requête HTTP. |
| **Prolongation correcte** | Base = `max(dateExpiration courante, now)` → pas de perte de jours restants ; `+1 mois` (MONTHLY) ou `+1 an` (YEARLY) selon `billingCycle` de la ligne `Payment`. |
| **Effets de bord non bloquants** | Email + notification sont appelés en `.catch()` — un échec SMTP ne fait jamais échouer l'activation (le webhook répond 200 pour éviter les retries NotchPay inutiles). |

### 5.3 Repli « Site Vitrine » (documenté, borné)

Si **aucune** ligne `Payment` ne correspond à la référence **et** que les
métadonnées NotchPay contiennent `tenantId` + `plan`, `handleWebhookNotification`
active directement le tenant (`updateTenantSubscription`, +1 mois). C'est le seul
chemin d'activation sans ligne `Payment` : il est réservé au flux public Site
Vitrine, journalisé en `warn`, et ne concerne **aucun** paiement d'abonnement
récent (`createPendingPayment` crée toujours une ligne référencée `GST-…`).

### 5.4 Doublon de webhook à traiter (phase 4, non fait)

`POST /payments/notchpay/webhook` et `POST /billing/webhook` appellent le **même**
`BillingService.handleWebhook` avec la même vérification de signature. Les deux
sont conservés le temps de confirmer l'URL réellement configurée dans le
dashboard NotchPay ; ensuite, n'en garder qu'**un** (`/billing/webhook`) pour
réduire la surface d'attaque. **Aucune suppression faite à ce stade.**

### 5.5 Pass de durcissement production (synchronisation paiements ↔ abonnements)

Audit de synchronisation effectué après la PARTIE 5 ; **4 trous corrigés** :

| # | Trou identifié | Risque | Correction |
|---|---|---|---|
| 1 | `markNotchPayComplete` : `findFirst` avec `OR: [{id}, {reference}, {notchPayId}]` — si les **3 identifiants sont `undefined`**, Prisma ignore les champs vides et le filtre devient vide → match de **n'importe quel paiement** | Un webhook malformé (payload sans référence) pouvait finaliser/échouer un paiement arbitraire et activer le mauvais tenant | **Fail-closed** : rejet immédiat (`return null`) si aucun identifiant |
| 2 | `markPaymentFailed` basculait **tout** tenant `ACTIVE` en `PAST_DUE` — y compris sur l'échec de l'**initialisation** d'un paiement anticipé | Un simple échec réseau NotchPay à l'init d'un renouvellement en avance dégradait des abonnements payés (puis `CANCELED` par le dunning) | Bascule `PAST_DUE` **uniquement si la période est réellement échue** (`currentPeriodEnd ?? dateExpiration` < now) |
| 3 | Repli Site Vitrine `updateTenantSubscription` ne mettait pas à jour `subscriptionStatus` / `currentPeriodEnd` / `paymentRetryCount` | Tenant activé dans les champs legacy mais **toujours bloqué par `AccessStatusGuard`** (qui lit `subscriptionStatus`) | Parité totale avec `markPaymentSuccess` (champs consolidés) |
| 4 | Le cron de reconciliation était **100 % Campay** ; aucun `PENDING` NotchPay n'était jamais rattrapé ni expiré | Webhook perdu = argent encaissé + abonnement jamais activé, **sans auto-résolution** ; `PENDING` éternels | Nouvelle branche NotchPay (pull `verifyTransaction`, bascule UNIQUEMENT sur réponse explicite) + expiration en masse des `PENDING` orphelins sans référence |

**Règle préservée (contrainte 9)** : le webhook signé reste le déclencheur
canonique. La vérification `verifyTransaction` (`GET /payments/{ref}`) est un
**rattrapage secondaire** du cron 2h00 — ⚠️ le chemin exact et la forme de la
réponse restent **à confirmer** sur le compte GesTock (docs inaccessibles depuis
l'environnement de build, voir 6.4 point 7). En cas d'erreur API, le cron ne
modifie rien (retry au passage suivant) — jamais de `FAILED` sur une
indisponibilité.
---

## PARTIE 6 — Livrables complémentaires

### 6.1 Variables d'environnement — état final visé

**À CONSERVER (NotchPay uniquement) :**

| Variable | Usage | Exposition |
|---|---|---|
| `NOTCHPAY_PUBLIC_KEY` | SDK inline frontend (via `checkout.publicKey`) | ✅ publique (assumée) |
| `NOTCHPAY_PRIVATE_KEY` | Initialisation des transactions (serveur) | ❌ backend only |
| `NOTCHPAY_HASH_KEY` | Vérification HMAC des webhooks (`x-notchpay-signature`) |  backend only — **jamais au frontend** |
| `NOTCHPAY_ENDPOINT` | Base URL API NotchPay | ❌ backend only |

**À RETIRER (après les points de non-retour, jamais avant) :**

| Variable | Retrait autorisé après | Phase |
|---|---|---|
| `CAMPAY_APP_USERNAME` | zéro `PENDING` Campay (`operatorTxId` non nul) | 2 |
| `CAMPAY_APP_PASSWORD` | idem | 2 |
| `CAMPAY_WEBHOOK_SECRET` | idem | 2 |
| `STRIPE_SECRET_KEY` | zéro `PENDING` Stripe | 3 |
| `STRIPE_PUBLISHABLE_KEY` | déjà inutilisé (aucun flux Stripe Elements câblé) | 3 |
| `STRIPE_WEBHOOK_SECRET` | zéro `PENDING` Stripe | 3 |

> ⚠️ Le nom exact des variables Campay en usage réel doit être reconfirmé sur
> l'environnement de production (`.env` non versionné) : `.env.example` fait foi
> ici, mais un écart prod/example est possible. **À vérifier** (voir 6.4).
### 6.2 Checklist de décommissionnement (ordre impératif)

| # | Étape | Commande / action | Point de non-retour |
|---|---|---|---|
| 0 | **Vérifier la couverture NotchPay** (dashboard compte GesTock) : pays, devises, canaux cartes internationaux | Manuel — décision produit | ⛔ **Bloque tout le reste** |
| 1 | Vérifier zéro `PENDING` Stripe/Campay (SQL 0.5.3) | SQL prod | ⛔ Bloque 3 et 5 |
| 2 | Blocage création Stripe (fait) + DTOs + frontend | code | — |
| 3 | **Phase de grâce** : garder `StripeWebhookController` + `CampayWebhookController` actifs, cron de reconciliation actif | ne rien supprimer | — |
| 4 | Neutraliser les doublons non signés (`PaymentsController.handleWebhook` vérifie la signature **si fournie** ; `handleCampayWebhook` sans garde) | code (`payments.controller.ts`) | — |
| 5 | Attendre l'expiration naturelle des `PENDING` en vol (cron) + re-vérifier le SQL à 0 | attendre | ⛔ **POINT DE NON-RETOUR n°1 (Campay)** : retrait `campay-webhook.controller.ts`, `campay.service.ts`, dépendances `TasksService`/`AdminService`, variables Campay |
| 6 | Idem Stripe | — | ⛔ **POINT DE NON-RETOUR n°2 (Stripe)** : retrait `stripe-webhook.controller.ts`, `stripe.service.ts`, variables Stripe |
| 7 | `npm uninstall stripe` (backend) | commande | après 6 seulement |
| 8 | Nettoyage final : fusion webhooks NotchPay redondants (garder `/billing/webhook`), retrait `stripe.svg` (frontend, non référencé), mise à jour `BILLING_SPEC.md` | code | — |
| 9 | **Ne jamais** réutiliser `PaymentMethod.STRIPE` ni supprimer la valeur de l'enum Postgres | règle permanente | — |

**Règle d'or** : à chaque ⛔, re-vérifier deux fois la requête SQL avant d'agir.
Un paiement en vol non confirmé est un litige client impossible à rattraper.
### 6.3 Fichiers touchés par cette itération (traçabilité)

| Fichier | Action | Motif |
|---|---|---|
| `backend-depot/src/common/config/notchpay-channels.config.ts` | créé/étendu | source de vérité pays/devises/canaux (PARTIE 2) |
| `backend-depot/src/common/validators/momo-phone.constraint.ts` | créé | `@MomoPhoneByCountry()` — validation par config (PARTIE 3) |
| `backend-depot/src/common/utils/payment-status.utils.ts` | créé | statut canonique + `canTransitionTo` (PARTIE 3) |
| `backend-depot/prisma/migrations/20260917000000_canonicalize_payment_status/migration.sql` | créé | `COMPLETED` → `SUCCESS` (aucune perte) |
| `backend-depot/prisma/schema.prisma` | modifié | `PaymentMethod.STRIPE` + `PaymentStatus.COMPLETED` documentés dépréciés (conservés) |
| `backend-depot/src/payments/payments.service.ts` | modifié | blocage Stripe, garde idempotence, normalisation pays, repli borné, **durcissement prod (5.5)** |
| `backend-depot/src/payments/notchpay.service.ts` | modifié | `verifyTransaction()` (rattrapage cron, endpoint à confirmer) |
| `backend-depot/src/tasks/tasks.service.ts` | modifié | cron reconciliation : branche NotchPay + expiration des `PENDING` orphelins |
| `backend-depot/src/payments/payments.controller.ts` | modifié | passage de `country` |
| `backend-depot/src/payments/dto/create-payment.dto.ts` | modifié | `country` + `NOTCHPAY_PAYMENT_METHODS` + `@MomoPhoneByCountry` |
| `backend-depot/src/billing/dto/initialize-billing.dto.ts` | modifié | idem |
| `backend-depot/src/billing/billing.service.ts` | modifié | pays transmis au flux canonique |
| `backend-depot/.env.example` | modifié | sectionnement CONSERVER / RETIRER |
| `frontend-depot/src/config/notchpayCountries.js` | créé | miroir config (PARTIE 2/4) |
| `frontend-depot/src/pages/PricingPage.jsx` | modifié | retrait Stripe, sélecteur pays, copy honnête, état d'attente (PARTIE 1/4) |
| `backend-depot/docs/PAYMENTS_NOTCHPAY_MIGRATION.md` | créé | ce document |

**Aucun fichier Stripe/Campay n'a été supprimé dans cette itération** (contrainte
« aucune suppression avant confirmation »). Le seul retrait côté code est
l'usage : plus aucune **création** Stripe/Campay n'est possible, et le frontend
n'expose plus Stripe.
### 6.4 Hypothèses & points à confirmer (à ne PAS présenter comme acquis)

1. **Couverture pays/devises/canaux réelle du compte NotchPay GesTock**
   —  **NON CONFIRMÉ** (dashboard inaccessible depuis le dépôt). Seul le
   Cameroun (`mtn`, `orange`) est prouvé **par le code de production**.
   La couverture **cartes internationales** (ce que Stripe gérait) et **tout
   autre pays** doivent être vérifiés dans le dashboard **avant** les points de
   non-retour. C'est une **décision produit** : sans confirmation, ne pas couper
   Cartes ni Campay.
2. **Texte du push USSD personnalisable ou non**
   — ❓ **NON CONFIRMÉ**. Rien dans `notchpayCheckout.ts` ni dans l'API
   d'initialisation ne l'expose. Hypothèse retenue : **non personnalisable**
   (généré par l'opérateur) → copy frontend volontairement générique. À confirmer
   auprès du support NotchPay avant toute promesse de libellé.
3. **Mode de calcul HT/TTC annuel** — ❓ **INCOHÉRENCE CONNUE** entre
   `src/common/config/subscription-pricing.config.ts` (remise −17 %, source de
   vérité du module Billing) et `PaymentsService.calculateAmount`
   (249 000 / 498 000 / 996 000 en dur). À unifier (checklist §7.6). **En l'état,
   le montant facturé dépend de l'endpoint appelé** : point à trancher
   explicitement (le frontend envoie un `amount` indicatif, le backend
   recalcule — mais avec quelle table ?).
4. **Mécanisme réel du dunning** —  `notchpayCustomerId` est marqué
   « futur usage » et **n'est utilisé nulle part** : aucun prélèvement récurrent
   NotchPay n'est câblé. Le dunning actuel se limite à `PAST_DUE` + emails.
   À confirmer si un re-prélèvement automatique est attendu par le produit.
5. **Variables d'environnement Campay réellement en production** — ❓ Le nom
   exact (`CAMPAY_APP_USERNAME` / `CAMPAY_APP_PASSWORD` / `CAMPAY_WEBHOOK_SECRET`)
   provient de `.env.example` ; à confirmer sur l'environnement de production
   avant retrait.
6. **URL de webhook réellement configurée dans le dashboard NotchPay** — ❓
   Détermine lequel de `/billing/webhook` ou `/payments/notchpay/webhook` est
   canonique (les deux fonctionnent aujourd'hui). À vérifier avant le nettoyage
   final (étape 8).
7. **Endpoint NotchPay de vérification d'une transaction** — ❓
   `NotchPayService.verifyTransaction()` utilise `GET /payments/{reference}`
   (convention de l'API). Les docs NotchPay étant inaccessibles depuis
   l'environnement de build, **confirmer le chemin et la forme de la réponse**
   (champ `status` : valeurs exactes) sur le compte GesTock avant de compter
   sur le rattrapage cron en production. Fail-safe en attendant : erreur API =
   paiement laissé `PENDING`, webhook signé reste le déclencheur canonique.
8. **Procédure de secours Orange Money (et autres opérateurs mobile money)**
   — ❓ **NON CONFIRMÉE.** Seule la procédure MTN MoMo (`*126#` → menu de
   validation des transactions en attente, ou application MTN MoMo) est
   confirmée par le support NotchPay (2026-09). Le code/la procédure
   équivalente pour Orange et les autres opérateurs doit être obtenu auprès
   du support NotchPay **avant** tout affichage client : le frontend affiche
   un message strictement neutre tant que ce n'est pas fait
   (`confirmed: false` dans `frontend-depot/src/config/paymentPushFallback.js`).

---

## PARTIE 7 — Moniteur push Mobile Money (conduite confirmée par le support NotchPay, 2026-09)

### 7.1 Faits confirmés par le support NotchPay

1. **Push automatique par défaut** : les canaux mobile money (`cm.mtn`,
   `cm.orange`, et tout canal du même type) déclenchent par défaut un **vrai
   push automatique** (pop-up PIN sur le téléphone du client). Le client n'a
   normalement **rien à composer manuellement**.
2. **Causes possibles de non-affichage** (hors du contrôle de
   GesTock/NotchPay) : timeout réseau opérateur, session USSD déjà active sur
   l'appareil, écran verrouillé/en veille au moment de l'envoi.
3. **Aucun moyen technique** ne permet de forcer l'affichage si l'opérateur
   ne distribue pas le push. Ce comportement **n'est pas spécifique à MTN** :
   il concerne **tout push mobile money**.

### 7.2 Conduite à tenir implémentée (identique quel que soit l'opérateur)

| # | Exigence | Implémentation |
|---|---|---|
| 1 | Décompte visuel 2-3 min invitant à vérifier le téléphone | `PUSH_WAIT_SECONDS = 150` (2 min 30) — `frontend-depot/src/config/paymentPushFallback.js`, affiché par `PaymentPushMonitor.jsx` |
| 2 | Bouton de relance (même canal) passé le délai | `handlePushRetry` (`PricingPage.jsx`) : ré-initie via `POST /payments/init` avec le MÊME moyen/canal/numéro puis redirige à nouveau vers la page hébergée ; bouton « Relancer la demande de paiement » du moniteur (visible après expiration) |
| 3 | Instruction de secours SEULEMENT après le délai, spécifique à l'opérateur | `getPushFallback(channelId)` : `cm.mtn` → `*126#` → menu de validation des transactions en attente, ou app MTN MoMo (confirmé) ; `cm.orange` et autres → `confirmed: false`, message strictement neutre (jamais de code deviné — voir §6.4 point 8) |
| 4 | Détection de la confirmation/échec | Scrutation en lecture seule `GET /payments/status/:reference` (JWT, scopée tenant, AUCUNE mutation) ajoutée à `PaymentsController`/`PaymentsService.getPaymentStatus` ; l'activation reste pilotée par le webhook signé (contrainte 9) |

### 7.3 Déclenchement du moniteur

Le push est déclenché par l'opérateur **après la confirmation du client sur
la page hébergée NotchPay** (« Collect ») — jamais par GesTock. Le parcours :

1. `POST /payments/init` → mémorisation du contexte du paiement en attente en
   `sessionStorage` (`gestock.pendingPayment.v1`, clé TTL 30 min) →
   redirection vers `authorization_url` (flux officiel inchangé).
2. Le client confirme sur la page NotchPay → l'opérateur envoie le push.
3. Au retour sur GesTock (bouton retour ou redirection callback), la page
   relit le paiement en attente et affiche `PaymentPushMonitor` : décompte,
   relance même canal, secours par opérateur après délai.
4. Le statut DB (mis à jour par le webhook signé) est scruté toutes les 8 s :
   `SUCCESS` → moniteur fermé avec message de confirmation ; `FAILED` →
   message d'échec actionnable ; sinon le décompte continue.

### 7.4 Format strict du numéro transmis à NotchPay

Fait validé par le support NotchPay (2026-09), voir §3.4 : E.164 **avec `+`**
(`+2376XXXXXXXX` pour le CM), unifié pour tous les pays via
`toE164MomoPhone()`. Tests : `backend-depot/src/common/config/notchpay-phone-e164.spec.ts`.
