# MISSION v2 — GeStock : Boutique / Supermarché / Dépôt Boissons → production, en temps réel

Ce document remplace la version précédente. Il a été produit après **clonage et audit direct du code**
(`git clone https://github.com/choubebebakon/depot-saas`, branche `main`, commit unique `965c48d "valider"`,
audité le 09/08/2026). Contrairement à la v1, chaque point ci-dessous reflète l'état RÉEL du code à cette date,
pas une supposition sur la base du nom des sous-modules. Le code a pu bouger depuis — explore quand même
chaque fichier cité avant de le modifier, comme le prévoit déjà la méthode ci-dessous.

**Contexte inchangé** : NestJS + Prisma + PostgreSQL (backend-depot) / React + Vite (frontend-depot),
multi-tenant, rôles PATRON/GERANT/MAGASINIER/CAISSIER/COMPTABLE/COMMERCIAL, 3 métiers actifs
(DEPOT_BOISSONS, BOUTIQUE, SUPERMARCHE) sur 20 au total, les 17 autres gelés via
`frontend-depot/src/.../SectorGuard.jsx` (array `METIERS_ACTIFS`).

---

## 0. ⚠️ Anomalie à lever AVANT de commencer

Des notes de suivi antérieures indiquaient la suppression du doublon "Personnel" (Boutique) comme
**terminée et validée**. **Ce n'est pas le cas dans le code actuellement sur `main`** : tout le doublon est
encore présent et actif :
- `frontend-depot/src/modules/boutique/pages/PersonnelPage.jsx`
- `frontend-depot/src/modules/boutique/forms/PersonnelBoutiqueForm.jsx`
- route `personnel` dans `frontend-depot/src/modules/boutique/routes.jsx` (lignes ~24 et ~82)
- `PersonnelService` + endpoints dans `backend-depot/src/modules/boutique/boutique.controller.ts`
  (lignes ~32, 48, 299-343) et son enregistrement dans `boutique.module.ts`

→ Avant de refaire ce travail (point 2.3 plus bas), confirme avec Albert si un commit a été fait en local
sans être poussé (autre machine/branche), pour éviter d'écraser un travail déjà fait ailleurs — ou pour
confirmer qu'il faut simplement le refaire ici.

---

## 1. Découverte majeure : deux systèmes parallèles coexistent pour Logo / Paramètres / Ticket

Le dépôt contient **deux implémentations distinctes** pour ce que le cahier des charges demande en 1.7/1.8 :

**Système générique (racine), câblé via `layouts/MainLayout.jsx` :**
- `frontend-depot/src/pages/SettingsPage.jsx` — upload de logo **déjà fonctionnel** (redimensionnement,
  aperçu, note UX : "Le logo sera automatiquement optimisé pour une impression nette sur ticket
  thermique"). Sauvegarde sur `Tenant.logo` (`String?`, déjà en base, ligne 766 du schéma).
- `frontend-depot/src/pages/VentesPage.jsx` + `frontend-depot/src/components/VenteForm.jsx`, qui utilisent
  `frontend-depot/src/components/Receipt80mm.jsx` — un composant de ticket **déjà production-ready** :
  logo en en-tête (filtré N&B haute-contraste pour impression thermique), nom entreprise, adresse,
  téléphone, numéro de facture, nom du caissier, détail des lignes (y compris casiers mixtes), remises,
  total, mode de paiement, QR code, mention "Généré par GeStock SaaS", et CSS `@media print` correcte
  pour du 80mm (`@page { size: auto; margin: 0mm }`, largeur forcée à 80mm à l'impression).

**Système par métier (`modules/`), utilisé aujourd'hui par les 3 métiers actifs :**
- Chacun a son propre `ParametresPage.jsx`. Vérifié pour Boutique : un sélecteur `devise`
  (FCFA/EUR/USD) existe, **aucun champ logo, aucun champ nom caissier**.
- Aucun des 3 métiers n'utilise `Receipt80mm` : Boutique n'a **aucune** impression de ticket câblée
  (aucune référence à `Receipt`, `window.print`, ou "imprim*" dans tout `modules/boutique/`) ;
  Dépôt Boissons (`modules/depot-boissons/pages/VentesPage.jsx`) fait un `window.print()` brut sans
  mise en forme ; Supermarché n'a rien de câblé non plus.

**Conséquence : ne construis rien de neuf pour le logo et le ticket.** Porte/adapte `Receipt80mm.jsx` et
la logique d'upload de `SettingsPage.jsx` dans les 3 `ParametresPage.jsx`/flux de vente des métiers actifs.
C'est un travail d'intégration à faible risque (code déjà éprouvé), pas une conception à partir de zéro —
bien moins lourd que ce que le cahier des charges initial supposait (Web Bluetooth + ESC/POS).

Le service backend `backend-depot/src/impression/impression.service.ts` (génère un ticket texte brut en
58mm, style ESC/POS) n'est utilisé par **aucun** composant frontend actuellement — code mort. Ne pas le
brancher, ne pas le supprimer (réemploi possible plus tard pour réimpression/duplicata hors-navigateur).

---

## 2. Décisions déjà tranchées (ne redemande pas confirmation à Albert pour celles-ci)

- **Upload logo + photo produit** : réutiliser `POST /upload/image` existant
  (`backend-depot/src/upload/upload.controller.ts` — multer, disque, filtre jpg/jpeg/png/gif/webp, 5 Mo
  max). Ne pas créer de second endpoint.
- **Ticket thermique** : porter `Receipt80mm.jsx`, PAS de Web Bluetooth / ESC-POS natif. Raison : le
  `window.print()` déjà utilisé partout ailleurs dans le projet fonctionne avec les imprimantes Bluetooth
  thermiques via les applications-pont Android courantes sur ce marché (type RawBT), sans dépendance
  supplémentaire, et sur tous les navigateurs — contrairement à Web Bluetooth, absent de Safari/iOS.
- **Date + heure de péremption** : **aucune nouvelle migration**. `LotStock.dlc` (type `DateTime`, donc
  date+heure en un seul champ, déjà indexé `@@index([dlc])`) existe et est déjà exploité par
  `backend-depot/src/dlc/dlc.service.ts` (statuts OK/ATTENTION/URGENT/EXPIRE, déduction FIFO, alertes,
  stats). Le vrai travail : exposer la création/édition de lot dans le formulaire Stock des 3 métiers
  actifs — le pattern existe déjà pour Pharmacie (`modules/pharmacie/pages/LotsPage.jsx`,
  `AlertesDlcPage.jsx`, `components/AlertCard.jsx`) : adapter ce pattern, ne pas le réinventer.
- **Photo produit** : ajouter `photoUrl String?` sur le modèle `Article` — migration réelle nécessaire ici
  (`npx prisma migrate dev --name add_article_photo_url`, cohérent avec l'historique de migrations
  existant qui utilise déjà ce workflow ; ne pas utiliser `db push`).
- **Caisse Boutique/Supermarché** : réutiliser les modèles `SessionCaisse`/`MouvementCaisse`
  (`backend-depot/prisma/schema.prisma`, lignes 588-621) et le module `backend-depot/src/caisse/`
  existants. Pas de nouveau modèle Prisma.
- **Temps réel** : voir Partie A ci-dessous — utiliser le WebSocket déjà en place, pas seulement du polling.

---

## PARTIE A — Quick wins temps réel (À FAIRE EN PREMIER)

Ces correctifs sont petits, à faible risque, et livrent l'essentiel de la valeur "temps réel" qu'Albert
demande, immédiatement.

### A.1 Brancher le WebSocket de notifications — le plus gros levier de tout ce document
`backend-depot/src/core/notifications/notifications.gateway.ts` est un Gateway Socket.io complet et déjà
solide : authentification JWT à la connexion, rooms par tenant (`tenant:{id}`) et par utilisateur
(`user:{id}`), limite de connexions par tenant (100). Le frontend s'y connecte déjà et l'écoute
(`frontend-depot/src/core/notifications/useNotifications.js`), avec un repli sur polling 30s si la socket
est indisponible — bon design défensif, à garder tel quel.

**Mais** `NotificationsService.create()`
(`backend-depot/src/core/notifications/notifications.service.ts`) n'injecte jamais `NotificationsGateway`
et n'appelle jamais `emitToTenant` / `emitToUser` / `emitCritical`. Résultat : chaque notification
(rupture de stock, péremption, prédiction IA, digest journalier) est bien créée en base mais **jamais
poussée en direct** — l'utilisateur ne la voit qu'au prochain refetch (jusqu'à 30s de délai), pas en
"temps réel" au sens strict qu'Albert demande.

**Action** : injecter `NotificationsGateway` dans `NotificationsService`, appeler
`emitToTenant(tenantId, 'notification:new', notif)` juste après chaque création/mise à jour réussie
(et `emitCritical` en plus si `priority` est `HIGH`/`CRITICAL`). Vérifier `notifications.module.ts` avant
de câbler pour s'assurer que le gateway est bien dans les `providers` du même module (le sens de
dépendance est à sens unique Service → Gateway, un `forwardRef` ne devrait pas être nécessaire, mais
vérifier avant d'assumer).

### A.2 Étendre les alertes de péremption aux 3 métiers actifs
`NotificationsScheduler.checkStockCritique()` (cron horaire,
`backend-depot/src/core/notifications/notifications.scheduler.ts`) vérifie déjà rupture/stock critique
pour **tous les tenants actifs, tous métiers confondus** — la partie "rupture de stock" du point 1.4 du
cahier des charges est donc déjà fonctionnelle pour les 3 métiers actifs. En revanche,
`checkMedicamentExpirations()` (péremption via `LotStock.dlc`) n'est appelée que
`if (tenant.metier === MetierType.PHARMACIE)`.

**Action** : élargir la condition à
`[MetierType.PHARMACIE, MetierType.BOUTIQUE, MetierType.SUPERMARCHE, MetierType.DEPOT_BOISSONS].includes(tenant.metier)`.
Vérifier que le `groupKey` passé aux notifications `STOCK_RUPTURE`/`STOCK_EXPIRATION` est stable
(ex. `stock_rupture:${articleId}`, `dlc:${lotId}`) pour profiter de la déduplication déjà présente dans
`NotificationsService.create()` (fenêtre d'1h par `groupKey`, met à jour l'existant au lieu d'en recréer
un) — sinon chaque passage horaire du cron spamme une nouvelle notification au lieu de mettre à jour
l'existante.

### A.3 Chatbot proactif — clarifier la portée réelle avant de coder
`backend-depot/src/modules/chatbot/chatbot.service.ts` est aujourd'hui **réactif uniquement**
(question → contexte Prisma → appel Gemini → réponse) : aucun mécanisme de message spontané.
Le point 1.4 du cahier des charges demande que "le chatbot informe l'utilisateur en temps réel" — une
fois A.1 et A.2 faits, l'utilisateur EST déjà informé en temps réel via le système de notifications
(toast + badge). Rendre le chatbot lui-même proactif (bulles de message spontanées dans la fenêtre de
chat) est une fonctionnalité distincte et sensiblement plus coûteuse.

**Recommandation par défaut** : considérer que A.1+A.2 satisfont l'exigence "informer en temps réel", et
laisser le chatbot réactif tel quel (il répond déjà correctement si on lui demande "y a-t-il des ruptures
de stock ?", cf. `getDonneesContextuelles()`). Si Albert veut vraiment des bulles proactives dans le
widget chatbot, lever ce point explicitement avec lui avant de le développer — effort et UX non triviaux.

---

## PARTIE B — Fonctionnalités transverses (état réel vérifié)

### B.1 (= 1.1) Formulaires et cohérence UI
Non audité en détail dans cette revue (nécessite un passage formulaire par formulaire sur la trentaine de
sous-modules des 3 métiers). Le pattern react-hook-form + zod est confirmé en place. Garder la méthode
d'origine : explorer chaque sous-module, lister ceux dont le formulaire est incomplet/non validé, corriger
un par un.

### B.2 (= 1.2) Rapports — export PDF/Excel + temps réel
- Export : `backend-depot/src/exports/` existe mais est dédié aux rapports de downgrade d'abonnement
  (facturation), pas aux rapports métier (Ventes/Stock/etc.). **Aucun export PDF/Excel des rapports
  métier n'existe aujourd'hui** — travail réel à faire. Réutiliser `pdf-lib` (déjà une dépendance, cf.
  `exports.service.ts`) pour le PDF. Pour Excel, le pattern actuel produit du CSV avec BOM UTF-8
  (`Buffer.from('\ufeff' + csv, 'utf-8')`, s'ouvre dans Excel mais n'est pas un vrai `.xlsx`) — par défaut,
  produire un vrai `.xlsx` via une librairie type `exceljs` puisque le cahier des charges dit
  explicitement "export Excel (xlsx)" ; documenter ce choix si tu dévies.
- Temps réel : appliquer `refetchInterval` (déjà utilisé dans ~20 fichiers du projet, pattern établi) sur
  les hooks de données des pages Rapports des 3 métiers si absent. Envisager en complément le WebSocket de
  A.1 pour un rafraîchissement immédiat plutôt qu'un simple polling.

### B.3 (= 1.3) Dashboards temps réel
Le pattern `refetchInterval: 30000` est largement utilisé dans le projet, mais **vérifier
concrètement**, pour chacun des 3 dashboards (`DashboardBoutique.jsx`, `DashboardSupermarche.jsx`,
`DashboardDepot.jsx`), s'il est bien présent — ne pas supposer que c'est déjà fait partout seulement parce
que le pattern existe ailleurs. Lister ceux qui ne l'ont pas et l'ajouter.

### B.4 (= 1.4) Alertes stock/péremption + IA
Traité en Partie A (A.1, A.2, A.3). Ne pas dupliquer le travail ici.

### B.5 (= 1.5) Photo produit à la création d'un article
Réel et à faire. `Article` n'a aujourd'hui aucun champ image. Migration : `photoUrl String?` sur `Article`
(voir "Décisions déjà tranchées"). Côté UI, s'inspirer du composant déjà existant
`frontend-depot/src/shared/components/forms/PhotoUpload.jsx`, déjà utilisé ailleurs dans le projet — le
pattern d'upload de photo est déjà éprouvé côté Prisma/backend (`MouvementStock.photoUrl` existe déjà en
base pour justifier un mouvement de stock), juste pas encore pour l'article lui-même.

### B.6 (= 1.6) Date + heure de péremption
Voir "Décisions déjà tranchées" — pas de migration, réutiliser `LotStock.dlc` + porter le pattern déjà
construit pour Pharmacie dans les 3 métiers actifs.

### B.7 (= 1.7) Module Paramètres complet
- **Logo** : ne pas reconstruire — porter la logique déjà écrite et fonctionnelle de
  `frontend-depot/src/pages/SettingsPage.jsx` (upload + redimensionnement + aperçu) dans les 3
  `ParametresPage.jsx` de métier. `Tenant.logo` existe déjà en base.
- **Nom caissier** : absent partout (vérifié dans `SettingsPage.jsx` et `boutique/pages/ParametresPage.jsx`)
  — à ajouter réellement. Point à clarifier avec Albert : est-ce un champ par session de caisse (le
  "caissier en poste" au moment de l'ouverture — auquel cas il devrait plutôt vivre sur `SessionCaisse`,
  cohérent avec B.9/2.1 et avec le fait que `Receipt80mm.jsx` affiche déjà `vente.caissier` par
  transaction), ou un champ statique de configuration tenant ? Recommandation par défaut : le rattacher à
  `SessionCaisse` plutôt qu'à Paramètres, car c'est là que l'info a un sens métier réel — mais documenter
  cette déviation du texte d'origine plutôt que de trancher silencieusement, car ça touche la structure de
  données.
- **Devise** : un sélecteur `devise` (FCFA/EUR/USD) existe déjà dans `boutique/pages/ParametresPage.jsx`.
  Vérifier s'il existe aussi dans Supermarché et Dépôt Boissons ; sinon, le répliquer. Le mot
  "synchroniser" du cahier des charges est ambigu : par défaut, l'interpréter comme "assurer que la
  devise choisie est utilisée de façon cohérente partout (tickets, rapports, dashboard)", **pas** comme
  "taux de change en direct via API externe" (fonctionnalité bien plus lourde et sensible
  financièrement). Si Albert voulait un vrai taux de change synchronisé, lever ce point avec lui avant de
  coder dans cette direction.

### B.8 (= 1.8) Ticket de caisse professionnel
Voir sections 1 et 2 ci-dessus. Porter `Receipt80mm.jsx` dans les 3 métiers actifs, remplacer les
`window.print()` bruts actuels. Alimenter `config.logo` / `config.nomEntreprise` / etc. depuis les
Paramètres de chaque métier une fois B.7 fait.

### B.9 (= 1.9) Performance POS — Supermarché
Non audité en détail dans cette revue (`POSCaissePage.jsx`, `InventairePage.jsx` non ouverts). Garder la
méthode d'origine : profiler le composant réel avant d'optimiser à l'aveugle (React DevTools Profiler,
re-renders, absence de `useMemo`/`useCallback` sur les listes, recherche produit debouncée ou non,
virtualisation si la liste articles dépasse ~200 lignes).

---

## PARTIE C — Corrections spécifiques par métier (état réel vérifié)

### C.1 (= 2.1) Boutique/Supermarché : sous-module Caisse manquant — CONFIRMÉ, réel travail
`boutique/pages/CaissePage.jsx` existe déjà mais est en réalité un écran de vente déguisé : titre
"Caisse POS — Point de vente", utilise le même formulaire `VenteBoutiqueForm` que `VentesPage.jsx`. Ce
n'est **pas** une gestion de session de caisse (pas d'ouverture/fermeture, pas de fond de caisse).

Actions :
1. Explorer l'implémentation réelle de Dépôt Boissons (`modules/depot-boissons/pages/CaissePage.jsx` +
   `backend-depot/src/caisse/`) pour confirmer qu'elle gère bien ouverture/fermeture/fond de caisse — non
   vérifié en détail dans cette revue, à faire en tout premier avant de répliquer.
2. Vérifier si `backend-depot/src/caisse/caisse.controller.ts` est déjà générique (multi-métier) ou
   verrouillé à Dépôt Boissons.
3. Remplacer le contenu de `boutique/pages/CaissePage.jsx` par une vraie gestion de session de caisse
   (réutilisant `SessionCaisse`/`MouvementCaisse`), garder `VentesPage.jsx` dédié à l'enregistrement des
   ventes.
4. Même travail pour Supermarché (`POSCaissePage.jsx` — non audité en détail, vérifier s'il a le même
   problème avant de le modifier).

### C.2 (= 2.2) Dépôt Boissons : doublon Stock/Article — NON-ISSUE CONFIRMÉ, aucune action requise
Vérifié dans le code : `modules/depot-boissons/pages/` n'a qu'une seule page `StockArticlesPage.jsx`
(pas de page "Article" séparée). Côté backend, `Article` (catalogue produit) et `Stock` (quantité par
dépôt, contrainte unique `[articleId, depotId]`) sont deux modèles Prisma légitimement distincts, pas un
doublon. **Ignorer ce point.**

### C.3 (= 2.3) Boutique : doublon Personnel/Utilisateur — CONFIRMÉ, réel travail (voir section 0)
Vérifié : le doublon existe toujours intégralement dans le code sur `main` (voir section 0). Aucune
migration de données nécessaire (pas de modèle Prisma `Personnel` séparé — tout pointe déjà vers `User`).
Actions : supprimer `PersonnelPage.jsx`, `PersonnelBoutiqueForm.jsx`, la route `personnel` dans
`boutique/routes.jsx`, `PersonnelService` et ses routes dans `boutique.controller.ts`, son enregistrement
dans `boutique.module.ts`. Grep global `Personnel` après coup pour confirmer zéro référence orpheline.

---

## PARTIE D — Durcissement production (nouveau, suite à la demande explicite "prêt pour la production")

1. **Concurrence Caisse** : avant de répliquer C.1, vérifier qu'il existe une contrainte empêchant
   l'ouverture de deux `SessionCaisse` simultanées pour le même dépôt (contrainte unique partielle en
   base, ou garde applicative). Si absente, l'ajouter — sinon deux caissiers peuvent ouvrir la caisse en
   double en cas de double-clic/double-onglet.
2. **Sécurité upload** : `upload.controller.ts` ne valide que `file.mimetype` (fourni par le client, donc
   falsifiable) + l'extension. Maintenant que cet endpoint sera utilisé plus largement (logo + photo
   produit, potentiellement par plusieurs rôles), envisager une validation par contenu réel du fichier
   (magic bytes, ex. librairie `file-type`) plutôt que la seule extension/mimetype déclarés.
3. **Scan cron stock critique** : `checkStockCritique()` fait une requête Prisma par tenant dans une
   boucle (N+1 au niveau tenant). Acceptable au volume actuel ; à surveiller si le nombre de tenants
   actifs grossit significativement.
4. **WebSocket et scalabilité horizontale** : `NotificationsGateway` garde l'état des connexions en
   mémoire locale (`Map`), sans adaptateur Redis. Fonctionne bien sur une seule instance backend ; à
   revoir (adaptateur Redis pour Socket.io) le jour où l'app tourne sur plusieurs instances/serveurs.
5. **Sauvegarde avant migration** : `pg_dump` de la base de production avant toute migration Prisma liée à
   ce chantier (B.5 ajoute une colonne — sans risque de perte, mais backup par principe avant
   `migrate deploy` en prod).
6. **Test de charge avant mise en production** : étant donné la demande explicite de fluidité du POS
   Supermarché "en forte charge", faire un test de charge basique (k6 ou artillery) sur l'endpoint de
   création de vente avant le go-live, pas seulement une optimisation frontend à l'aveugle.
7. **Suivi d'erreurs** : vérifier si un outil de monitoring d'erreurs (type Sentry) est déjà en place ;
   sinon, le recommander avant la mise en production, surtout avec l'ajout de nouveaux flux (WebSocket,
   upload, cron étendu).
8. **Visibilité du dépôt** : le dépôt a pu être cloné de façon anonyme (`git clone` public, sans
   authentification). Aucun secret en clair trouvé dans le code (recherche de `.env` réels et de motifs
   de clés/API secrets : rien trouvé — seul `.env.example` est présent). À confirmer avec Albert si c'est
   voulu (dépôt public assumé) : le code source complet (architecture, logique métier, grille tarifaire)
   est visible publiquement, ce qui peut être un choix stratégique ou un oubli.

---

## PARTIE E — Ordre d'exécution recommandé

1. Lever l'anomalie Personnel (section 0) avec Albert.
2. Partie A (A.1, A.2) — gains temps réel immédiats, risque faible, forte valeur perçue.
3. C.3 (doublon Personnel) — petit, isolé, aucune migration.
4. B.5 + B.6 (photo produit + péremption) — une migration Prisma groupée (`photoUrl`), portage du pattern
   Pharmacie pour les lots/DLC.
5. B.7 + B.8 ensemble — ils partagent le même besoin (logo du tenant) : porter `SettingsPage.jsx` et
   `Receipt80mm.jsx` dans les 3 métiers.
6. C.1 (Caisse Boutique/Supermarché) — le plus structurant, à faire après avoir stabilisé le reste.
7. B.2 + B.3 (rapports export + dashboards temps réel).
8. B.9 (performance POS) + Partie D (durcissement production) juste avant la mise en production.
9. B.1 (audit formulaires) en continu, en parallèle de tout le reste, module par module.

Sauter C.2 (non-issue confirmé).

---

## Méthode de travail (reprise de l'original, inchangée)

1. **Explore avant de coder** : liste les fichiers/composants concernés par chaque point avant de modifier
   quoi que ce soit. Les chemins ci-dessus sont un point de départ vérifié à la date de cet audit, pas une
   garantie que rien n'a bougé depuis.
2. **Un point à la fois** : traite les points dans l'ordre de la Partie E, et à la fin de chaque point,
   indique clairement ce qui a été modifié (fichiers touchés) avant de passer au suivant.
3. **Pas de suppression destructive sans migration** : toute suppression de sous-module doit être précédée
   d'une vérification des données existantes et d'un script de migration si nécessaire (C.3 n'en a pas
   besoin, voir plus haut).
4. **Tests** : après chaque partie, vérifie que les 3 modules métier compilent et que les routes
   existantes (non concernées par le changement) fonctionnent toujours.
5. **Si une ambiguïté bloque l'implémentation** (ex. nom de composant introuvable, logique métier peu
   claire) sur un point qui n'a **pas** de décision déjà tranchée ci-dessus, arrête-toi sur ce point
   précis, explique le blocage et propose une solution avant de continuer — ne fais pas d'hypothèse
   silencieuse sur un point structurant. Pour les points déjà tranchés (section "Décisions déjà
   tranchées"), applique la décision sans redemander.

## Livrable attendu

- Code fonctionnel pour l'ensemble des points ci-dessus, dans les 3 modules métier concernés.
- Un résumé final listant : les fichiers créés, les fichiers modifiés, les fichiers supprimés, et les
  éventuelles migrations Prisma exécutées.