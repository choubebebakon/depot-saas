# IMPLEMENTATION.md — Plan de correction GeStock (3 métiers actifs)

## Instructions pour l'agent IA (Claude Code / Gemini)

Ce fichier liste les correctifs issus d'un audit complet du repo (lecture réelle du code, pas une estimation). Règles à respecter strictement :

1. **Traite les tâches dans l'ordre** : P0 en premier, puis P1, P2, P3. À l'intérieur d'une section, respecte l'ordre numéroté.
2. **Une tâche à la fois.** Ne groupe jamais plusieurs tâches dans un seul commit, même si elles semblent liées.
3. **Après chaque tâche** : lance `npm run build` dans `frontend-depot` ET la compilation dans `backend-depot`, confirme que ça passe, **coche la case** (`[x]`) de la tâche dans ce fichier, puis commit séparément avec un message clair.
4. **Si un build échoue** : ne passe pas à la tâche suivante. Signale l'erreur exacte et arrête-toi pour validation humaine.
5. **Ne modifie aucun fichier non mentionné** dans la tâche en cours.
6. Ce fichier est vivant : mets à jour les cases à cocher au fur et à mesure, pour que la prochaine session (humaine ou IA) sache exactement où on en est.

---

## P0 — Bloquant avant toute mise en production commerciale

### Formulaires cassés (saisie non capturée)

- [x] **1. Reconnecter 4 formulaires à react-hook-form.** Fichiers : `frontend-depot/src/modules/boutique/forms/StockBoutiqueForm.jsx`, `VenteBoutiqueForm.jsx`, `DepenseBoutiqueForm.jsx`, `frontend-depot/src/modules/supermarche/forms/DepenseForm.jsx`. Chaque `<FormField name="X" control={control} .../>` doit devenir `<Controller name="X" control={control} render={({ field }) => (<FormField name="X" value={field.value} onChange={(e) => field.onChange(e.target.value)} error={errors.X?.message} /* + props existantes */ />)} />`. Reproduis le pattern déjà correct dans `modules/depot-boissons/forms/ArticleBoissonsForm.jsx` (référence, ne pas modifier). Ne touche pas à `shared/components/forms/FormField.jsx`.

- [x] **2. Corriger l'affichage d'erreur de 4 formulaires Boutique en `useState` manuel.** Fichiers : `frontend-depot/src/modules/boutique/forms/CaisseBoutiqueForm.jsx`, `FactureBoutiqueForm.jsx`, `FournisseurBoutiqueForm.jsx`, `PromotionBoutiqueForm.jsx`. Remplacer chaque `error={errors.X?.message}` par `error={errors.X}` (la variable `errors` contient déjà directement la chaîne de message, pas un objet react-hook-form).

- [x] **3. Unifier le sous-module Client Boutique.** Dans `frontend-depot/src/modules/boutique/pages/ClientsPage.jsx` : remplacer `ClientBoutiqueForm` par `shared/forms/ClientForm.jsx` avec `metier="boutique"`, en suivant le pattern déjà utilisé par `modules/supermarche/pages/ClientsPage.jsx`. Adapter les colonnes du tableau pour afficher `adresse` et `plafondCredit`/`soldeCredit` (voir `modules/depot-boissons/pages/ClientsPage.jsx` pour le pattern). Une fois validé, supprimer `modules/boutique/forms/ClientBoutiqueForm.jsx`. Aucun changement backend requis (le module `clients` est déjà unifié).

- [x] **4. Corriger `ConditionnementForm.jsx` (Dépôt Boissons).** Fichier : `frontend-depot/src/modules/depot-boissons/forms/ConditionnementForm.jsx`. Le schéma `articleId: z.string().uuid('Article invalide').optional()` bloque la soumission quand l'utilisateur choisit "Sans article" (envoie `''`, que `.optional()` n'accepte pas). Remplacer par `z.string().uuid('Article invalide').optional().or(z.literal(''))`, comme déjà fait dans `ConsigneForm.jsx` du même dossier.

- [x] **5. Corriger `InventaireForm.jsx` (Supermarché).** Fichier : `frontend-depot/src/modules/supermarche/forms/InventaireForm.jsx`. Deux corrections : (a) le schéma exige `depotId` mais aucun champ visible ne permet de le saisir — ajouter un champ dépôt dans le formulaire, ou transmettre systématiquement une prop `depotId` valide depuis `InventairePage.jsx`. (b) `useState(() => {...}, [metier])` doit devenir `useEffect(() => {...}, [metier])` avec un `useState` classique séparé pour stocker le résultat — React ignore silencieusement le 2ᵉ argument de `useState`, donc le rechargement ne se déclenche jamais en réaction à un changement de `metier`.

### Écritures backend silencieuses (succès affiché, rien ne se passe réellement)

- [ ] **6. Sécuriser la décrémentation de stock lors d'une vente.** Fichiers : `backend-depot/src/modules/boutique/boutique.service.ts` (~ligne 544) et `backend-depot/src/modules/supermarche/supermarche.service.ts` (~ligne 695), dans la transaction de création de vente. Remplacer `await tx.stock.updateMany({...});` par : vérifier `r.count === 0` après l'appel et lever `BadRequestException("Stock introuvable pour cet article dans ce dépôt — vente annulée.")` si c'est le cas. Reste de la transaction inchangé.

- [ ] **7. Sécuriser `fermerCaisse` dans les 3 métiers.** Fichiers : `boutique.service.ts`, `supermarche.service.ts`, `depot-boissons.service.ts`, fonction `fermerCaisse` (identique dans les 3). Même correction : vérifier `count === 0` après le `updateMany` sur `sessionCaisse` et lever `BadRequestException("Aucune session de caisse ouverte à fermer.")`.

- [ ] **8. Sécuriser `payerDette` et corriger `updateClient` (Dépôt Boissons).** Fichier : `backend-depot/src/modules/depot-boissons/depot-boissons.service.ts`. Dans `payerDette` : vérifier `count === 0` après le `updateMany` sur `client` et lever `NotFoundException` avant de créer l'enregistrement `detteClient`. Dans `updateClient` : remplacer le `updateMany` (qui retourne `{count}` au lieu du client) par un `findFirst` (throw `NotFoundException` si absent) suivi d'un `update()` classique qui renvoie l'objet complet.

- [ ] **9. Enrichir le logging des erreurs Prisma.** Fichier : `backend-depot/src/common/filters/all-exceptions.filter.ts`, méthode `getMessage()`. Pour `Prisma.PrismaClientValidationError`, logger `this.logger.error('PrismaClientValidationError: ' + exception.message)` côté serveur avant de renvoyer le message générique au client (ne pas exposer le détail Prisma au client, seulement dans les logs).

### Sécurité multi-tenant

- [ ] **10. Empêcher la création de compte inter-tenant.** Fichier : `backend-depot/src/users/users.controller.ts`, méthodes `create` (`POST /users`) et `createEmployee` (`POST /users/employees`). Remplacer `const tenantId = body.tenantId || req.user?.tenantId;` par `const tenantId = req.user.tenantId;` — ne jamais faire confiance à un `tenantId` envoyé par le client pour une création de compte. C'est la correction la plus prioritaire de tout le fichier.

- [ ] **11. Corriger 3 fuites de données actives inter-tenant.** Trois appels du frontend Dépôt Boissons n'envoient aucun `tenantId`, ce qui fait remonter des données mélangées de tous les tenants : `ConsigneForm.jsx` (`GET /consignes/types`), `TricycleForm.jsx` + `TourneeForm.jsx` (`GET /users/commerciaux` et `GET /tournees/tricycles`). Corriger des deux côtés : (a) frontend — ajouter `params: { tenantId: user.tenantId }` aux 3 appels ; (b) backend — dans `consignes.controller.ts` (`findTypes`), `users.controller.ts` (`findCommerciaux`), `tournees.controller.ts` (`findTricycles`), ajouter `@Req() req` et utiliser `req.user.tenantId` en ignorant tout `tenantId` de la query, pour fermer le problème définitivement même si un futur écran oublie de le transmettre.

- [ ] **12. Sécuriser `POST /supermarche/reset-data`.** Fichiers : `supermarche.controller.ts` et `supermarche.service.ts`. Ajouter un champ `confirmation` obligatoire devant valoir exactement `"SUPPRIMER"` dans le body, sinon `BadRequestException`. Ajouter un log serveur avant exécution (`tenantId`, `userId`, timestamp).

- [ ] **13. Ajouter la validation `tenantId` sur les 57 endpoints de Dépôt Boissons.** Fichier : `backend-depot/src/modules/depot-boissons/depot-boissons.controller.ts`. Ajouter une méthode privée `getTenantId(req)` identique à celle de `boutique.controller.ts` (throw `BadRequestException` si `req.user?.tenantId` absent), puis remplacer chaque usage direct de `req.user.tenantId` par `this.getTenantId(req)`. Fais ce remplacement par blocs de 10-15 méthodes, avec un build après chaque bloc plutôt qu'à la toute fin.

- [ ] **14. Sécuriser `caisse.controller.ts` (Supermarché).** Ajouter `@Req() req` et dériver `tenantId` de `req.user.tenantId` sur `ouvrir`, `fermer`, `resume`, `session-active`, en ignorant toute valeur envoyée par le client.

---

## P1 — Important, juste après le P0

- [ ] **15. Convergence des 4 implémentations de `usePermission`.** Faire converger tous les imports vers `shared/hooks/usePermission.js` (le plus complet). Marquer `hooks/usePermission.js`, `hooks/usePermissions.js` et `shared/permissions/usePermission.js` comme dépréciés puis les retirer une fois plus aucun import restant.

- [ ] **16. Rebrancher ou masquer les 3 pages coquilles vides de Supermarché.** `AbonnementPage.jsx`, `DepotsPage.jsx`, `UtilisateursPage.jsx` (`modules/supermarche/pages/`) ne contiennent qu'un titre. Porter l'équivalent fonctionnel le plus proche depuis Dépôt Boissons ou Boutique, ou retirer temporairement ces entrées de la sidebar Supermarché si non prêtes.

- [ ] **17. Abonner le POS Supermarché aux notifications temps réel existantes.** `backend-depot/src/events/vente.gateway.ts` émet déjà `nouvelle_vente` en WebSocket, mais rien dans `POSCaissePage.jsx`/`POSSupermarcheForm.jsx` ne s'y abonne (seul du polling 15-30s existe). S'abonner à l'événement (même pattern que `hooks/useMagasinierAlerte.jsx`) et déclencher `queryClient.invalidateQueries(...)` à réception.

- [ ] **18. Ajouter le champ "nom de la caissière" aux 3 pages Paramètres.** `modules/depot-boissons/pages/ParametresPage.jsx`, `modules/supermarche/pages/ParametresPage.jsx`, `modules/boutique/pages/ParametresPage.jsx`. Suivre le pattern déjà en place pour `devise`/`logo` dans ces mêmes fichiers.

---

## P2 — Écarts fonctionnels cahier des charges, à planifier

- [ ] **19. Décider de l'architecture DLC (péremption).** `ArticleSupermarcheForm.jsx` référence déjà une gestion "par lot" (Stock → Lots), mais cette page n'existe pour aucun des 3 métiers actifs (seulement dans le module gelé `modules/pharmacie/pages/LotsPage.jsx`, qui peut servir de patron). Décider : construire la page Lots pour les 3 métiers actifs (meilleure conception, plus de travail), ou revenir à un champ `dateExpiration` simple sur l'article (plus rapide, moins flexible pour le multi-lot).

- [ ] **20. Finaliser le crédit client Boutique.** `CreditClientService` dans `boutique.service.ts` est une classe stub vide. Une fois la tâche 3 appliquée, le champ `plafondCredit`/`soldeCredit` du modèle `Client` partagé fonctionnera automatiquement pour Boutique côté saisie. Vérifier si un flux de règlement dédié (bouton "Régler", comme en Dépôt Boissons) est nécessaire.

---

## P3 — Dette de fond, hors urgence

- [ ] **21. Convergence des 3 abstractions de data-fetching** (`useQuery` direct, `useData`, `useSectorQuery`) vers une seule — toutes sont déjà connectées à de vraies routes, aucune donnée mockée trouvée nulle part.

- [ ] **22. Découper `boutique.service.ts`** (actuellement plusieurs classes `@Injectable()` indépendantes dans un seul fichier monolithique) sur le modèle du module `clients` (fichiers séparés par domaine).

- [ ] **23. Évaluer la suppression du code mort.** Un ensemble complet de pages/composants/hooks à la racine de `frontend-depot/src` (`pages/`, `components/`, `hooks/`, `contexts/`, hors `modules/`), monté via `layouts/MainLayout.jsx` + `PAGE_REGISTRY`, n'est référencé par aucune route active dans `App.jsx` (`SectorDashboardRoute` est défini mais jamais utilisé). Ce code appelle une quinzaine de contrôleurs backend génériques non sécurisés (`articles`, `stocks`, `ventes`, `rapports`, `catalogue`, `commissions`, `maintenance`, `audit`, `commandes`, `fournisseurs`, `depots`, `transferts`, `impression`, `analyses`, `admin`, `dlc`). Si confirmé obsolète après vérification avec l'équipe, supprimer frontend + controllers backend correspondants pour réduire la surface d'attaque et la taille du code.

---

## Ce qui est déjà confirmé solide (ne pas toucher sans raison précise)

- Couverture des permissions parfaite sur les 3 controllers métier (ratio 1:1 endpoints/`@RequirePermission`).
- Aucune donnée mockée détectée nulle part dans les 65 fichiers frontend des 3 métiers.
- Impression ticket 80mm (`Receipt80mm`) cohérente et fonctionnelle dans les 3 métiers.
- Export PDF/Excel fonctionnel dans les 3 métiers.
- Scan code-barres temps réel via douchette physique (`BarcodeScanner.jsx`/`useBarcodeScanner`) déjà correctement câblé sur `POSSupermarcheForm.jsx` et `VenteBoutiqueForm.jsx`.
- `ReceptionsPage.jsx` Supermarché → `updateReception` utilise le bon pattern (`tx.stock.upsert` avec vérification préalable d'existence) — à citer comme modèle si besoin d'un exemple de bonne pratique.
- `PromotionSupermarcheForm.jsx`, `RayonForm.jsx`, `CategorieForm.jsx` (Boutique), `ChargementForm.jsx`, `ConsigneForm.jsx`, `TourneeForm.jsx` (Dépôt Boissons) : aucune anomalie trouvée à la lecture complète.
- `ArticleBoissonsForm.jsx` (Dépôt Boissons) est le patron de référence pour le câblage react-hook-form + Zod + Controller — à copier, pas à réécrire.