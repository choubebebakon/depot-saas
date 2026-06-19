# Site Vitrine Gestock

Site vitrine public pour Gestock SaaS avec page de tarifs et tunnel de paiement NotchPay.

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

Le site tourne sur **http://localhost:3001**

## Build

```bash
npm run build
```

## Configuration

Variables d'environnement dans `.env`:

```
VITE_BACKEND_API_URL=http://localhost:3000/api/v1
```

## Architecture

- **Port**: 3001 (évite les conflits avec l'app de gestion sur 5173 et le backend sur 3000)
- **Backend API**: NestJS sur http://localhost:3000
- **Passerelle de paiement**: NotchPay (Orange Money, MTN Mobile Money, Visa/Mastercard)

## Flux utilisateur

1. L'utilisateur est redirigé depuis l'app de gestion (http://localhost:5173) vers la page des tarifs (http://localhost:3001/tarifs) avec `tenantId` et `email` dans l'URL
2. L'utilisateur sélectionne son plan (SOLO, PME, PREMIUM) et son moyen de paiement
3. Le site appelle le backend NestJS pour initialiser le paiement NotchPay
4. L'utilisateur est redirigé vers NotchPay pour effectuer le paiement
5. Après paiement, NotchPay envoie un webhook sécurisé au backend pour mettre à jour l'abonnement du tenant
