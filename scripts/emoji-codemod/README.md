# Nettoyage des emojis → icônes lucide-react (GeStock)

Codemod AST (jscodeshift) qui analyse tout le repo `depot-saas` et remplace
les emojis par des composants lucide-react, **sans jamais casser la syntaxe**.

## Ce qui a été analysé

- **972 fichiers** de code scannés (`.jsx .tsx .js .ts`, hors `node_modules`)
- **2230 occurrences** d'emojis trouvées, **205 emojis distincts**
- **184 emojis mappés** vers un vrai export lucide-react (validé un par un
  contre `lucide-react@1.31.0` — aucun import inventé)
- Testé en conditions réelles sur **ton repo cloné** : `npm run build` (Vite)
  passe sans erreur sur les 332 fichiers modifiés, `npm run lint` ne détecte
  **aucun import lucide-react inutilisé**.

## Ce que le script fait automatiquement (sûr à 100%)

Tout emoji qui apparaît **dans du texte réellement affiché en JSX** :

```jsx
// Avant
<h1>💊 Tableau de Bord Pharmacie</h1>
{isValid ? '✅' : '❌'}

// Après
<h1><Pill className="inline-icon" aria-hidden="true" />{' '}Tableau de Bord Pharmacie</h1>
{isValid ? <CheckCircle2 className="inline-icon" aria-hidden="true" /> : <XCircle className="inline-icon" aria-hidden="true" />}
```

Les imports `lucide-react` sont ajoutés/fusionnés automatiquement par fichier
(pas de doublon, réutilise l'import existant s'il y en a un).

**Résultat sur ton repo : 332 fichiers modifiés, ~1300 emojis remplacés.**

## Ce que le script NE touche JAMAIS (et pourquoi)

Une chaîne de caractères JS ne peut pas contenir un composant React — y
mettre `<Pill />` casserait le code. Ces cas sont donc **recensés avec
l'icône suggérée**, jamais modifiés automatiquement :

| Catégorie | Exemple | Occurrences |
|---|---|---|
| Attribut JSX | `title="🔍 Rechercher"`, `placeholder="..."` | 149 |
| Objet de config | `{ icon: '💊', label: 'Médicament' }` | 474 |
| Autre | `toast.success('✅ Enregistré')`, `console.log(...)` | 273 |

**Total : 896 occurrences** listées avec fichier, ligne, emoji et icône
suggérée dans `emoji-report-summary.md` (généré à l'étape 3 ci-dessous).

Le cas le plus fréquent (474 occurrences) est le pattern `icon: '💊'` dans un
tableau de config (listes de métiers, quick actions, catégories). Le corriger
correctement veut dire changer la valeur en référence de composant **et**
adapter le rendu (`{item.icon}` → `<item.icon className="..." />`) — ça se
fait fichier par fichier, pas en aveugle sur 315 fichiers à la fois.

## Fichiers de ce toolkit

```
scripts/emoji-codemod/
├── emoji-icon-map.cjs        184 emojis -> nom d'icône lucide-react (validés)
├── replace-emojis.cjs        le codemod jscodeshift
└── summarize-report.js       transforme le rapport brut en résumé lisible
```

## Utilisation (PowerShell, une commande à la fois)

### 1. Installer jscodeshift

```powershell
cd chemin\vers\depot-saas
```
```powershell
npm install -D jscodeshift@0.15.2
```

### 2. Aperçu avant modification (dry-run, rien n'est écrit)

```powershell
npx jscodeshift -t scripts/emoji-codemod/replace-emojis.cjs --extensions=jsx,tsx,js,ts --parser=tsx --dry --print frontend-depot/src backend-depot/src
```

Regarde les chiffres finaux (`X ok` = fichiers qui seraient modifiés,
`0 errors` attendu).

### 3. Vérifier que ton arbre git est propre, puis lancer pour de vrai

```powershell
git status
```

Si tout est commité (`nothing to commit`) :

```powershell
Remove-Item emoji-report.jsonl -ErrorAction SilentlyContinue
```
```powershell
npx jscodeshift -t scripts/emoji-codemod/replace-emojis.cjs --extensions=jsx,tsx,js,ts --parser=tsx frontend-depot/src backend-depot/src
```

### 4. Générer le résumé des occurrences à traiter manuellement

```powershell
node scripts/emoji-codemod/summarize-report.js
```

Ça écrit `emoji-report-summary.md` à la racine du repo (à côté de
`emoji-report.jsonl`) : un tableau par fichier avec ligne, emoji, icône
suggérée. **Ton rapport réel (896 occurrences, généré sur ton repo lors de
mon test) est déjà inclus dans cette livraison** — pas besoin de relancer si
tu veux juste le consulter, remets simplement `emoji-report.jsonl` et
`emoji-report-summary.md` à la racine du repo avant d'ouvrir ce dernier.

### 5. Vérifier que ça build toujours

```powershell
cd frontend-depot
```
```powershell
npm run build
```

### 6. Revue de code : ignore le bruit d'indentation

Le moteur de réimpression (recast) réindente parfois le bloc JSX modifié
d'un fichier (même contenu, indentation légèrement différente). C'est
cosmétique — le build le confirme — mais ça peut gonfler le diff affiché.
Pour une revue propre :

```powershell
git diff -b
```

(`-b` = ignore les changements d'espaces, ne montre que le vrai contenu
changé)

## Pour traiter les 896 occurrences restantes avec Blackbox

Prompt consolidé, à coller tel quel — Blackbox a tout le contexte nécessaire
dans `emoji-report-summary.md` et `emoji-icon-map.cjs` :

```
Ouvre scripts/emoji-codemod/emoji-report-summary.md : c'est la liste
exhaustive des emojis GeStock qui n'ont pas pu être remplacés automatiquement
(attributs JSX, objets de config, arguments de fonction), avec pour chacun
le fichier, la ligne, et l'icône lucide-react suggérée (référence complète
des noms valides : scripts/emoji-codemod/emoji-icon-map.cjs).

Traite-les fichier par fichier, dans l'ordre du rapport (du plus impacté au
moins impacté). Pour chaque fichier :
1. Ouvre-le et localise chaque occurrence listée.
2. Attribut JSX (title=, placeholder=, aria-label=...) : remplace le texte
   par sa version sans emoji (l'icône ne peut pas aller dans un attribut
   string) SAUF si le contexte visuel le justifie, auquel cas ajoute
   l'icône comme élément JSX visible à côté au lieu de dans l'attribut.
2. Objet de config avec `icon: '💊'` : remplace par `icon: Pill` (référence
   de composant, importée depuis lucide-react en haut du fichier) ET trouve
   le point de rendu correspondant (`{x.icon}` typiquement) pour le changer
   en `<x.icon className="w-5 h-5" />` — vérifie chaque site de rendu avant
   de modifier, certains peuvent afficher l'icône dans un contexte texte
   (garde alors une version texte si besoin).
3. toast/console/alert : remplace juste le texte sans emoji, pas d'icône
   (ces messages ne sont jamais du JSX rendu).
Donne-moi le fichier corrigé complet à chaque fois, pas de diff partiel.
Un fichier à la fois, je valide avant le suivant.
```

## Détails techniques (si besoin de déboguer)

- Le codemod distingue précisément le JSX enfant réellement affiché
  (`JSXText`, `JSXExpressionContainer` en position d'enfant, branches de
  ternaire/`&&` dans un enfant JSX) des attributs et du JS pur — voir les
  commentaires en tête de `replace-emojis.cjs`.
- 21 emojis très rares (1 occurrence chacun : drapeaux 🇨🇲🇫🇷, symboles ⚕♂♀,
  quelques emojis nourriture/objets ambigus sans équivalent lucide clair) ne
  sont volontairement pas mappés — ils remontent dans le rapport comme les
  autres cas non traités, à décider au cas par cas plutôt que de deviner.
- `emoji-icon-map.cjs` est trié par fréquence réelle dans ton code (les plus
  utilisés en premier) et commenté avec le compteur d'occurrences.
