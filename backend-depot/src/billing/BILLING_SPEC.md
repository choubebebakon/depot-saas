# GesTock — Spécifications Techniques du Billing Engine (NotchPay)

## 1. Architecture

```
Frontend (PricingPage)
    │ POST /api/v1/billing/initialize
    ▼
BillingController → BillingService → PlanChangeService (quote/validation)
                                  → PaymentsService → NotchPay API
    │
    │ POST /api/v1/billing/webhook  (signature HMAC)
    ▼
NotchPayWebhookGuard → WebhookIdempotencyService → PaymentsService
                                                  → Tenant (activation/lock)

SubscriptionLifecycleService (@Cron minuit)
    → lockExpiredTenants()
    → sendExpiryAlerts(J-5, J-1)
```

## 2. Modèle de données — Tenant

| Champ Prisma            | Type        | Description                                      |
|-------------------------|-------------|--------------------------------------------------|
| `planType`              | PlanType    | Plan actuel (TRIAL, SOLO, PME, ENTERPRISE)       |
| `status`                | TenantStatus| ACTIVE, PAST_DUE, EXPIRED, TRIAL…               |
| `statutAbonnement`      | Enum        | Miroir métier de `status`                        |
| `subscriptionEnd`       | DateTime?   | `subscription_ends_at` — fin d'abonnement        |
| `maxDepots`             | Int         | Quota structures (1 SOLO, 10 PME, 50 ENTERPRISE) |
| `notchpayCustomerId`    | String?     | ID client NotchPay (futur usage récurrent)       |
| `lastAlertSentAt`       | DateTime?   | Anti-doublon notifications expiration            |
| `estActif`              | Boolean     | false = accès écriture coupé                       |

### BillingWebhookEvent (idempotence)

| Champ       | Description                              |
|-------------|------------------------------------------|
| `eventKey`  | ID transaction NotchPay (unique)         |
| `status`    | `PROCESSED` — événement déjà traité      |
| `reference` | Référence GesTock (GST-…)                |

## 3. Sécurité Webhook

- **Guard** : `NotchPayWebhookGuard` sur `POST /billing/webhook`
- **Header** : `x-notchpay-signature` ou `x-notch-signature`
- **Algorithme** : HMAC-SHA256 du `rawBody` avec `NOTCHPAY_WEBHOOK_SECRET`
- **Rejet** : HTTP 401 si signature absente ou invalide
- **Idempotence** : `BillingWebhookEvent` — doublon `payment.complete` → HTTP 200 sans retraitement

## 4. URLs de retour (initialize)

Configurées dynamiquement via `FRONTEND_URL` :

- Succès : `/billing/success?reference={ref}`
- Annulation : `/billing/cancel?reference={ref}`

## 5. Upgrade / Downgrade

### Upgrade (SOLO → PME)
1. `PlanChangeService.quotePlanChange()` calcule le prorata
2. `chargeAmount = prix_cible_TTC - crédit_prorata`
3. Webhook `payment.complete` → `maxDepots` mis à jour immédiatement

### Downgrade (PME → SOLO) — garde-fou
```
Si activeDepots > limite_plan_cible :
  HTTP 400 DOWNGRADE_BLOCKED
  "Vous devez d'abord supprimer ou désactiver N dépôts..."
```

### Devis préalable
`GET /api/v1/billing/quote?planId=PME&billingCycle=MONTHLY`

## 6. CRON — Cycle de vie (minuit, Africa/Douala)

| Action                    | Condition                          | Effet                          |
|---------------------------|------------------------------------|--------------------------------|
| Verrouillage              | `subscriptionEnd < now`            | EXPIRED, estActif=false        |
| Alerte J-5                | expire dans exactement 5 jours     | Email + notif EXPIRY_J5        |
| Alerte J-1                | expire dans exactement 1 jour      | Email + notif EXPIRY_J1        |

`lastAlertSentAt` évite les doublons le même jour.

## 7. Variables d'environnement

```env
NOTCHPAY_PRIVATE_KEY=sk_xxx
NOTCHPAY_PUBLIC_KEY=pk_xxx
NOTCHPAY_WEBHOOK_SECRET=whsec_xxx
NOTCHPAY_ENDPOINT=https://api.notchpay.co
FRONTEND_URL=http://localhost:5173
```

## 8. Endpoints

| Méthode | Route                    | Auth   | Description                    |
|---------|--------------------------|--------|--------------------------------|
| GET     | /billing/quote           | JWT    | Devis changement de plan       |
| POST    | /billing/initialize      | JWT    | Init paiement + checkout_url   |
| POST    | /billing/webhook         | HMAC   | Webhook NotchPay               |
