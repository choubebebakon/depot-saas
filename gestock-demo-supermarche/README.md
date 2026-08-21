# Démo GesTock — Supermarché

Vidéo 1920x1080, 30fps, 30 secondes. Recréation stylisée : dashboard
KPI, rayons colorés, 3 types de promotions, caisse/POS rapide, outro.

## Installation (PowerShell)

```
cd gestock-demo-supermarche
npm install
```

## Prévisualiser

```
npm run start
```

## Exporter en vidéo

```
npm run build
```

Sort dans `out/demo-supermarche.mp4`.

## Voix off

Voir `VOICEOVER.md`.

## Personnaliser

- `src/Demo.tsx` : toutes les scènes.
- `src/components.tsx` : mêmes composants réutilisables que la démo
  Dépôt Boissons (cohérence visuelle entre les vidéos).
