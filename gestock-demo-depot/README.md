# Démo GesTock — Dépôt de Boissons

Vidéo 1920x1080, 30fps, 29 secondes. Recréation stylisée du dashboard
(pas une capture d'écran) : cartes KPI, top articles, évolution du
stock, tournée de livraison animée, clients débiteurs, outro logo.

## Installation (PowerShell)

```
cd gestock-demo-depot
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

Sort dans `out/demo-depot-boissons.mp4`.

## Ajouter la voix off

Voir `VOICEOVER.md` pour le script avec timecodes et comment l'intégrer.

## Personnaliser

- `src/Demo.tsx` : toutes les scènes (une par section du dashboard).
- `src/components.tsx` : cartes KPI, panneaux, titres, sous-titres —
  réutilisables pour les démos Supermarché et Boutique à venir.
- Les chiffres affichés (ventes, stock, tournées...) sont des données
  d'exemple réalistes — remplace-les dans `src/Demo.tsx` si tu veux
  des chiffres précis.
