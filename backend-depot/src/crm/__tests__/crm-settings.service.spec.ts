import { CrmSettingsService } from '../crm-settings.service';

describe('CrmSettingsService', () => {
  const service = new CrmSettingsService();

  it('n’invente AUCUNE règle métier quand le shop n’a rien configuré', () => {
    const settings = service.resolve(null);

    expect(settings.loyalty).toEqual({
      enabled: false,
      configured: false,
      pointsPerCurrencyUnit: null,
      pointsToCurrencyRatio: null,
      currency: null,
    });
    expect(settings.shrinkageAlert).toEqual({
      enabled: false,
      configured: false,
      maxDeltaPercent: null,
      windowDays: null,
    });
    expect(settings.boutique).toEqual({
      sizeSystem: null,
      sizeSystemConfigured: false,
    });
    expect(settings.diagnostics).toEqual([]);
  });

  it('lit les paramètres réellement renseignés par le commerçant', () => {
    const settings = service.resolve({
      crm: {
        channels: { whatsapp: true, instagram: false, messenger: true },
        history: { defaultLimit: 10, maxLimit: 25 },
        metaData: { maxArrayItems: 5, appendPaths: ['preferences.couleurs'] },
        loyalty: {
          enabled: true,
          pointsPerCurrencyUnit: 1000,
          pointsToCurrencyRatio: 100,
          currency: 'XOF',
        },
        shrinkageAlert: { enabled: true, maxDeltaPercent: 3, windowDays: 30 },
        boutique: { sizeSystem: 'EU' },
      },
    });

    expect(settings.channels).toEqual({
      whatsapp: true,
      instagram: false,
      messenger: true,
    });
    expect(settings.history).toEqual({ defaultLimit: 10, maxLimit: 25 });
    expect(settings.metaData).toEqual({
      maxArrayItems: 5,
      appendPaths: ['preferences.couleurs'],
    });
    expect(settings.loyalty.configured).toBe(true);
    expect(settings.loyalty.currency).toBe('XOF');
    expect(settings.shrinkageAlert.configured).toBe(true);
    expect(settings.boutique).toEqual({
      sizeSystem: 'EU',
      sizeSystemConfigured: true,
    });
  });

  it('borne la pagination aux plafonds serveur', () => {
    const settings = service.resolve({
      crm: { history: { defaultLimit: 5000, maxLimit: 9000 } },
    });

    expect(settings.history.maxLimit).toBe(50);
    expect(settings.history.defaultLimit).toBe(50);
  });

  it('ignore les valeurs invalides et les signale dans diagnostics', () => {
    const settings = service.resolve({
      crm: {
        loyalty: { enabled: 'peut-être', pointsPerCurrencyUnit: 'abc' },
        boutique: { sizeSystem: 'FR' },
      },
    });

    expect(settings.loyalty.enabled).toBe(false);
    expect(settings.loyalty.pointsPerCurrencyUnit).toBeNull();
    expect(settings.boutique.sizeSystem).toBeNull();
    expect(settings.diagnostics.length).toBeGreaterThanOrEqual(3);
  });

  it('accepte un nombre sérialisé en chaîne (interface d’administration)', () => {
    const settings = service.resolve({
      crm: { loyalty: { pointsPerCurrencyUnit: '500', pointsToCurrencyRatio: '50' } },
    });

    expect(settings.loyalty.pointsPerCurrencyUnit).toBe(500);
    expect(settings.loyalty.configured).toBe(true);
  });

  it('ne considère pas la fidélité comme configurée si un seul ratio est fourni', () => {
    const settings = service.resolve({
      crm: { loyalty: { enabled: true, pointsPerCurrencyUnit: 1000 } },
    });

    expect(settings.loyalty.enabled).toBe(true);
    expect(settings.loyalty.configured).toBe(false);
  });
});