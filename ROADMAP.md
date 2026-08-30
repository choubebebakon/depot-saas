# GeStock — Roadmap des métiers

## ✅ Métiers actifs (disponibles clients)
- DEPOT_BOISSONS
- BOUTIQUE  
- SUPERMARCHE

## 🔒 Métiers gelés (réactivation future)
| Métier | Priorité | Notes |
|--------|----------|-------|
| PHARMACIE | Haute | Module à auditer et optimiser |
| RESTAURANT | Haute | Module à auditer et optimiser |
| SALON_BEAUTE | Moyenne | Module à auditer et optimiser |
| PRESSING | Moyenne | Module à auditer et optimiser |
| GARAGE_AUTOMOBILE | Moyenne | Module à auditer et optimiser |
| ELEVAGE | Basse | Module à auditer et optimiser |
| HOTEL | Basse | Module à auditer et optimiser |
| IMMOBILIER | Basse | Module à auditer et optimiser |
| LIBRAIRIE | Basse | Module à auditer et optimiser |
| GLACIER_SNACK | Basse | Module à auditer et optimiser |
| CLINIQUE | Basse | Module à auditer et optimiser |
| CIMENT_BTP | Basse | Module à auditer et optimiser |
| TELEPHONIE | Basse | Module à auditer et optimiser |
| BOULANGERIE | Basse | Module à auditer et optimiser |
| QUINCAILLERIE | Basse | Module à auditer et optimiser |
| TRANSPORT | Basse | Module à auditer et optimiser |

## � Systèmes d'autorisation

GeStock utilise deux systèmes de contrôle d'accès distincts :

### 1. `@RequirePermission` (Granulaire)
- **Utilisé par** : Les 3 métiers actifs (DEPOT_BOISSONS, BOUTIQUE, SUPERMARCHE)
- **Portée** : Rôle × Métier × Sous-module × Action (lecture/écriture)
- **Exemple** : `@RequirePermission('stock_articles', 'read')`
- **Avantages** : Contrôle très fin, fail-closed une fois correctement appliqué
- **Inconvénients** : Plus verbeux, nécessite un seed de permissions par métier
- **Quand l'utiliser** : Pour tout nouveau métier actif ou module nécessitant un contrôle granulaire des actions

### 2. `@Roles` (Grossier)
- **Utilisé par** : Audit, Support, Platform Admin, et les 17 métiers gelés
- **Portée** : Rôle seul (PATRON, GERANT, CAISSIER, ADMIN)
- **Exemple** : `@Roles(RoleUser.PATRON)`
- **Avantages** : Simple, rapide à mettre en place
- **Inconvénients** : Moins précis, fail-open par défaut (si oublié, l'endpoint est accessible)
- **Quand l'utiliser** : Pour les modules transverses (Audit, Support) ou en transition vers un système granulaire

### Règle pour les nouveaux développements
- **Privilégier `@RequirePermission`** pour tout nouveau métier ou module métier complexe
- **Utiliser `@Roles`** uniquement pour les modules transverses simples (ex: Support, Audit)
- **Jamais mélanger** les deux sur le même endpoint

## �📋 Procédure de réactivation d'un métier
1. Auditer et corriger le module
2. Tester tous les formulaires et endpoints
3. Décommenter le métier dans `METIERS_ACTIFS` (SectorGuard.jsx)
4. Commit + deploy
