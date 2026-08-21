# Animation du logo GesTock — projet Remotion

Vidéo carrée (1080x1080, 30fps, 5s) : le logo apparaît avec un effet de zoom/spring,
un halo cyan qui respire en continu, et un reflet lumineux qui balaie le logo en diagonale.

## Installation (PowerShell)

Se placer dans le dossier du projet :

```
cd gestock-remotion
```

Installer les dépendances :

```
npm install
```

## Prévisualiser en direct (Remotion Studio)

```
npm run start
```

Cela ouvre un studio dans le navigateur avec un curseur pour scruber l'animation image par image.

## Exporter la vidéo finale

MP4 (H.264, fond noir plein — le plus courant) :

```
npm run build
```

Le fichier sort dans `out/gestock-logo.mp4`.

WebM (VP9, supporte la transparence si tu changes le fond en `null`/`transparent`) :

```
npm run build:webm
```

## Personnaliser

- `src/Logo.tsx` contient toute la logique d'animation (timing, glow, sweep, fond).
- `durationInFrames` dans `src/Root.tsx` contrôle la durée totale (150 frames = 5s à 30fps).
- Pour changer le format (ex. 1920x1080 pour du 16:9), modifie `width`/`height` dans `src/Root.tsx`.
- `public/logo.png` est ton fichier source — remplace-le si tu as une version haute résolution.

## Idées d'évolution

- Ajouter le texte "GesTock" séparément (fade + slide) si tu fournis un logo sans texte intégré.
- Décliner une version pour intro d'app (2-3s, boucle) ou une version longue pour écran de démarrage/pub.
