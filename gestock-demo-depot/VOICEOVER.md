# Script voix off — Démo Dépôt Boissons (français)

Durée totale de la vidéo : 29 secondes (870 frames à 30fps).
Voix suggérée : ton professionnel, posé, débit modéré (proche d'une voix
de présentation produit B2B).

| Timecode | Scène | Texte à dire |
|---|---|---|
| 0:00 – 0:03 | Intro logo | *(silence, ou "GesTock.")* |
| 0:03 – 0:09 | Dashboard | "Suivez vos ventes, votre stock et votre caisse, en temps réel." |
| 0:09 – 0:16 | Top articles / stock | "Visualisez vos articles les plus vendus, et l'évolution de votre stock en un coup d'œil." |
| 0:16 – 0:23 | Tournées | "Planifiez vos tournées de livraison en un clic." |
| 0:23 – 0:27 | Créances | "Et gardez le contrôle sur les créances de vos clients." |
| 0:27 – 0:29 | Outro | "GesTock. La gestion de votre dépôt, simplifiée." |

## Comment générer la voix (recommandé)

Je n'ai pas d'outil de synthèse vocale connecté directement dans ce chat.
Deux options simples :

1. **HyperFrames (HeyGen)** — connecteur déjà proposé plus haut, génère
   voix + visuel directement.
2. **ElevenLabs / TTS de ton choix** — colle le texte ci-dessus (sans les
   timecodes), génère un MP3, ajuste sa vitesse pour que chaque phrase
   tombe sur le bon timecode, puis :
   - place le fichier dans `public/voiceover.mp3`
   - décommente le bloc `<Audio src={staticFile('voiceover.mp3')} />`
     en bas de `src/Demo.tsx` (et ajoute `Audio` à l'import `remotion`
     en haut du fichier)

Si les timecodes ne collent pas exactement à l'audio généré, dis-le moi
et j'ajuste les durées des `Sequence` dans `Demo.tsx` pour qu'elles
matchent ta voix off réelle (plus fiable que l'inverse).
