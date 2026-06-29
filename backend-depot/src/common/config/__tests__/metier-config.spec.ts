import {
  getMetierConfig,
  isRelevant,
  METIER_CONFIG,
  MetierConfig,
} from '../metier-config';

describe('METIER_CONFIG Validation', () => {
  const METIERS_ATTENDUS = [
    'DEPOT_BOISSONS',
    'BOUTIQUE',
    'PHARMACIE',
    'RESTAURANT',
    'HOTEL',
    'QUINCAILLERIE',
    'SUPERMARCHE',
    'GARAGE_AUTOMOBILE',
    'CLINIQUE',
    'TRANSPORT',
    'IMMOBILIER',
    'ELEVAGE',
    'BOULANGERIE',
    'PRESSING',
    'SALON_BEAUTE',
    'PARFUMERIE',
    'LIBRAIRIE',
    'GLACIER_SNACK',
    'CIMENT_BTP',
    'TELEPHONIE',
  ];

  describe('Validation de la configuration globale', () => {
    it('devrait avoir tous les 21 métiers configurés', () => {
      METIERS_ATTENDUS.forEach((metier) => {
        expect(METIER_CONFIG[metier]).toBeDefined();
        expect(METIER_CONFIG[metier]).not.toBeNull();
      });
    });

    it('ne devrait pas avoir de configuration vide', () => {
      Object.values(METIER_CONFIG).forEach((config) => {
        expect(config).toBeDefined();
        expect(config).not.toBeNull();
      });
    });
  });

  describe('Validation de chaque configuration de métier', () => {
    METIERS_ATTENDUS.forEach((metier) => {
      describe(`Métier: ${metier}`, () => {
        let config: MetierConfig;

        beforeAll(() => {
          config = METIER_CONFIG[metier];
        });

        it('devrait avoir un tableau keywords non vide', () => {
          expect(config.keywords).toBeDefined();
          expect(Array.isArray(config.keywords)).toBe(true);
          expect(config.keywords.length).toBeGreaterThan(0);
        });

        it('chaque keyword devrait être une chaîne non vide', () => {
          config.keywords.forEach((keyword) => {
            expect(typeof keyword).toBe('string');
            expect(keyword.trim()).not.toBe('');
          });
        });

        it('devrait avoir une questionCritique non vide', () => {
          expect(config.questionCritique).toBeDefined();
          expect(typeof config.questionCritique).toBe('string');
          expect(config.questionCritique.trim()).not.toBe('');
        });

        it('devrait avoir une propriété tableSpecifique définie', () => {
          expect(config.tableSpecifique).toBeDefined();
          expect(
            config.tableSpecifique === null ||
              typeof config.tableSpecifique === 'string',
          ).toBe(true);
        });
      });
    });
  });

  describe('Fonction getMetierConfig', () => {
    it('devrait retourner la configuration correcte pour un métier existant', () => {
      const config = getMetierConfig('PHARMACIE');
      expect(config).toBeDefined();
      expect(config.keywords).toContain('médicament');
      expect(config.tableSpecifique).toBe('medicament');
    });

    it('devrait retourner la configuration générique pour un métier inconnu', () => {
      const config = getMetierConfig('METIER_INCONNU');
      expect(config).toBeDefined();
      expect(config.keywords).toContain('stock');
      expect(config.tableSpecifique).toBeNull();
    });

    it('devrait gérer les métiers avec table spécifique', () => {
      const configPharmacie = getMetierConfig('PHARMACIE');
      expect(configPharmacie.tableSpecifique).toBe('medicament');

      const configHotel = getMetierConfig('HOTEL');
      expect(configHotel.tableSpecifique).toBe('chambre');

      const configRestaurant = getMetierConfig('RESTAURANT');
      expect(configRestaurant.tableSpecifique).toBe('table');
    });

    it('devrait gérer les métiers sans table spécifique', () => {
      const config = getMetierConfig('DEPOT_BOISSONS');
      expect(config.tableSpecifique).toBeNull();
    });
  });

  describe('Fonction isRelevant', () => {
    it('devrait détecter un mot-clé dans le message', () => {
      const config = getMetierConfig('PHARMACIE');
      expect(isRelevant('Quels médicaments expirent bientôt ?', config)).toBe(
        true,
      );
    });

    it("devrait retourner false si aucun mot-clé n'est trouvé", () => {
      const config = getMetierConfig('PHARMACIE');
      expect(isRelevant('Comment ça va ?', config)).toBe(false);
    });

    it('devrait être insensible à la casse', () => {
      const config = getMetierConfig('PHARMACIE');
      expect(isRelevant('MÉDICAMENT', config)).toBe(true);
      expect(isRelevant('médicament', config)).toBe(true);
      expect(isRelevant('Médicament', config)).toBe(true);
    });

    it('devrait détecter des mots-clés partiels', () => {
      const config = getMetierConfig('PHARMACIE');
      expect(isRelevant('Date limite de consommation', config)).toBe(true);
    });
  });

  describe("Tests d'intégration avec ChatbotService (simulation)", () => {
    // Ces tests simulent le comportement attendu du ChatbotService
    // sans dépendre de l'implémentation réelle du service

    it('devrait router vers handleSpecializedQuery pour PHARMACIE avec mot-clé DLC', () => {
      const metier = 'PHARMACIE';
      const message = 'Quels médicaments expirent bientôt ?';
      const config = getMetierConfig(metier);

      const shouldBeSpecialized =
        isRelevant(message, config) && config.tableSpecifique !== null;

      expect(shouldBeSpecialized).toBe(true);
      expect(config.tableSpecifique).toBe('medicament');
    });

    it('devrait router vers handleGenericQuery pour DEPOT_BOISSONS avec mot-clé stock', () => {
      const metier = 'DEPOT_BOISSONS';
      const message = 'Quel est mon stock de sécurité ?';
      const config = getMetierConfig(metier);

      const shouldBeSpecialized =
        isRelevant(message, config) && config.tableSpecifique !== null;

      expect(shouldBeSpecialized).toBe(false);
      expect(config.tableSpecifique).toBeNull();
    });

    it('devrait router vers handleGenericQuery pour HOTEL sans mot-clé spécifique', () => {
      const metier = 'HOTEL';
      const message = 'Comment ça va ?';
      const config = getMetierConfig(metier);

      const shouldBeSpecialized =
        isRelevant(message, config) && config.tableSpecifique !== null;

      expect(shouldBeSpecialized).toBe(false);
    });

    it('devrait router vers handleSpecializedQuery pour HOTEL avec mot-clé chambre', () => {
      const metier = 'HOTEL';
      const message = 'Combien de chambres sont disponibles ?';
      const config = getMetierConfig(metier);

      const shouldBeSpecialized =
        isRelevant(message, config) && config.tableSpecifique !== null;

      expect(shouldBeSpecialized).toBe(true);
      expect(config.tableSpecifique).toBe('chambre');
    });

    it('devrait router vers handleSpecializedQuery pour RESTAURANT avec mot-clé table', () => {
      const metier = 'RESTAURANT';
      const message = 'Combien de tables sont occupées ?';
      const config = getMetierConfig(metier);

      const shouldBeSpecialized =
        isRelevant(message, config) && config.tableSpecifique !== null;

      expect(shouldBeSpecialized).toBe(true);
      expect(config.tableSpecifique).toBe('table');
    });
  });

  describe('Tests des questions critiques', () => {
    METIERS_ATTENDUS.forEach((metier) => {
      it(`devrait avoir une question critique pertinente pour ${metier}`, () => {
        const config = getMetierConfig(metier);
        expect(config.questionCritique).toBeDefined();
        expect(config.questionCritique.length).toBeGreaterThan(10);
        expect(config.questionCritique.includes('?')).toBe(true);
      });
    });
  });

  describe('Tests de cohérence des keywords', () => {
    it('ne devrait pas avoir de keywords en double dans un même métier', () => {
      Object.values(METIER_CONFIG).forEach((config) => {
        const uniqueKeywords = new Set(config.keywords);
        expect(uniqueKeywords.size).toBe(config.keywords.length);
      });
    });

    it('devrait avoir des keywords pertinents pour chaque métier', () => {
      const configPharmacie = getMetierConfig('PHARMACIE');
      expect(configPharmacie.keywords).toContain('médicament');
      expect(configPharmacie.keywords).toContain('dlc');

      const configHotel = getMetierConfig('HOTEL');
      expect(configHotel.keywords).toContain('chambre');
      expect(configHotel.keywords).toContain('réservation');

      const configRestaurant = getMetierConfig('RESTAURANT');
      expect(configRestaurant.keywords).toContain('table');
      expect(configRestaurant.keywords).toContain('commande');
    });
  });
});
