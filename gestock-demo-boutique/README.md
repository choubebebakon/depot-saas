# Démo GesTock — Boutique

Vidéo 1920x1080, 30fps, 29 secondes. Dashboard KPI, catégories
dynamiques par type de boutique, crédit client, vente simplifiée, outro.

## Installation (PowerShell)

```
cd gestock-demo-boutique
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

Sort dans `out/demo-boutique.mp4`.

## Voix off

Voir `VOICEOVER.md`.

## Personnaliser

- `src/Demo.tsx` : toutes les scènes.
- `src/components.tsx` : mêmes composants que les démos Dépôt Boissons
  et Supermarché — cohérence visuelle entre les 3 vidéos.
