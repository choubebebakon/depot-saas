# Architecture Configuration-Driven du Chatbot GeStock

## Overview

Le ChatbotService adopte une architecture **Configuration-Driven** qui sépare la logique générique de traitement des requêtes de la configuration métier spécifique. Cette approche permet de gérer 21 métiers différents (DEPOT_BOISSONS, PHARMACIE, HOTEL, etc.) sans duplication de code ni maintenance complexe.

## Architecture Technique

### Découplage Logique / Configuration

Le système repose sur trois couches distinctes :

1. **Couche Configuration** (`metier-config.ts`)
   - Dictionnaire `METIER_CONFIG` centralisé
   - Définit pour chaque métier : keywords, tableSpecifique, questionCritique
   - Fonctions utilitaires : `getMetierConfig()`, `isRelevant()`

2. **Couche Service** (`chatbot.service.ts`)
   - Méthode `chat()` : orchestrateur principal
   - `handleSpecializedQuery()` : routing dynamique vers handlers spécialisés
   - `handleGenericQuery()` : logique commune (stock, ventes, clients, caisse)
   - Handlers spécialisés : `handlePharmacieQuery()`, `handleHotelQuery()`, `handleRestaurantQuery()`

3. **Couche Données** (Prisma)
   - Tables génériques : stock, vente, client, fournisseur, sessionCaisse
   - Tables spécialisées : medicament, chambre, table

### Flux de Traitement

```
Requête utilisateur → chat() → getMetierConfig(metier)
                                    ↓
                            isRelevant(message, config)
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
        tableSpecifique ? OUI                  tableSpecifique ? NON
                    ↓                               ↓
        handleSpecializedQuery()            handleGenericQuery()
                    ↓                               ↓
        Handler spécialisé                   Logique générique
                    ↓                               ↓
                    └───────────────┬───────────────┘
                                    ↓
                            buildPrompt() → callGemini()
```

## Pourquoi cette architecture est cruciale pour la scalabilité SaaS

### 1. **Extensibilité sans risque**
Ajouter un nouveau métier ne nécessite que :
- Une entrée dans `METIER_CONFIG` (2-3 lignes)
- Optionnellement un handler spécialisé si table spécifique
- Aucune modification de la logique existante

### 2. **Maintenance centralisée**
La configuration de tous les métiers est centralisée dans un seul fichier (`metier-config.ts`). Les modifications de keywords ou de questions critiques sont propagées automatiquement sans toucher au code métier.

### 3. **Testabilité**
La séparation permet de tester :
- La configuration indépendamment de la logique
- La logique générique indépendamment des métiers
- Chaque handler spécialisé isolément

### 4. **Performance**
Le routing dynamique via `specializedHandlers` évite les cascades de `if/else` imbriqués. La lookup table est O(1) vs O(n) pour des conditions séquentielles.

### 5. **Onboarding de nouveaux métiers**
L'ajout d'un nouveau métier suit un pattern répétitif et documenté :
1. Ajouter entrée dans `METIER_CONFIG`
2. Si table spécifique : créer handler et l'ajouter au mapping
3. Si pas de table : la logique générique gère automatiquement

### 6. **Gestion de la dette technique**
Les 18 métiers sans logique spécifique utilisent automatiquement la logique générique. L'ajout progressif de handlers spécialisés se fait sans refactoring, en ajoutant simplement des entrées dans le mapping.

## Avantages par rapport à une architecture monolithique

| Aspect | Architecture Monolithique | Configuration-Driven |
|--------|---------------------------|---------------------|
| Ajout métier | Modification du code existante | Ajout configuration uniquement |
| Bug logique générique | Impact sur tous les métiers | Isolé dans handleGenericQuery |
| Test | Tests complexes inter-dépendants | Tests unitaires indépendants |
| Maintenance | Risque de régression | Séparation des responsabilités |
| Scalabilité | Linéaire avec complexité | Constante avec nombre de métiers |

## Conclusion

Cette architecture Configuration-Driven transforme la gestion multi-tenant d'un défi technique en un problème de configuration. Elle permet à GeStock de scaler à des dizaines de métiers supplémentaires sans augmentation proportionnelle de la complexité du code, tout en maintenant une qualité et une maintenabilité élevées.
