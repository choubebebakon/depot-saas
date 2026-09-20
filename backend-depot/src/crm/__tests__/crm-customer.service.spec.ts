import { PrismaService } from '../../prisma.service';
import { encodeHistoryCursor } from '../crm-cursor';
import { CrmCustomerService } from '../crm-customer.service';
import { CrmLogger } from '../crm-logger.service';
import { CrmSettingsService } from '../crm-settings.service';
import type { CrmIdentifier } from '../crm.types';

const phoneIdentifier: CrmIdentifier = {
  kind: 'PHONE',
  value: '655000000',
  channel: 'WHATSAPP',
};

const baseClient = {
  id: 'client-1',
  nom: 'Awa',
  telephone: '655000000',
  instagramId: null,
  messengerId: null,
  depotId: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  metaData: { preferences: { couleur: 'rouge' } },
};

interface ServiceOptions {
  readonly tenant?: unknown;
  readonly client?: unknown;
  readonly ventes?: readonly unknown[];
  readonly loyalty?: unknown;
  readonly consignes?: readonly unknown[];
}

function buildService(options: ServiceOptions = {}) {
  const prisma = {
    tenant: {
      findUnique: jest
        .fn()
        .mockResolvedValue(options.tenant ?? { parametres: null }),
    },
    client: { findUnique: jest.fn().mockResolvedValue(options.client ?? null) },
    vente: { findMany: jest.fn().mockResolvedValue(options.ventes ?? []) },
    programmeFidelite: {
      findUnique: jest.fn().mockResolvedValue(options.loyalty ?? null),
    },
    portefeuilleConsigne: {
      findMany: jest.fn().mockResolvedValue(options.consignes ?? []),
    },
  } as unknown as PrismaService;

  return {
    prisma,
    service: new CrmCustomerService(
      prisma,
      new CrmSettingsService(),
      new CrmLogger(),
    ),
  };
}

describe('CrmCustomerService', () => {
  it('renvoie found:false pour un contact inconnu, sans jamais exposer la PII', async () => {
    const { service, prisma } = buildService();

    const result = await service.findCustomer({
      tenantId: 'tenant-1',
      identifier: phoneIdentifier,
      requestId: 'req-1',
    });

    expect(result.found).toBe(false);
    if (result.found) throw new Error('résultat inattendu : found=true');

    expect(result.reason).toBe('UNKNOWN_IDENTIFIER');
    expect(result.channel).toBe('WHATSAPP');
    expect(result.identifierRef).not.toContain('655000000');
    expect(result.nextAction).toMatch(/nom/i);

    // Le tenant de la requête est bien celui de la clé, jamais celui du body.
    expect(prisma.client.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId_telephone: {
            tenantId: 'tenant-1',
            telephone: '655000000',
          },
        },
      }),
    );
  });

  it('borne l’historique, renvoie un curseur keyset et formate les montants', async () => {
    const ventes = [
      {
        id: 'v3',
        reference: 'V3',
        date: new Date('2026-09-03T10:00:00.000Z'),
        statut: 'PAYE',
        modePaiement: 'CASH',
        total: 1500.5,
      },
      {
        id: 'v2',
        reference: 'V2',
        date: new Date('2026-09-02T10:00:00.000Z'),
        statut: 'PAYE',
        modePaiement: 'CASH',
        total: 250,
      },
      {
        id: 'v1',
        reference: 'V1',
        date: new Date('2026-09-01T10:00:00.000Z'),
        statut: 'ANNULE',
        modePaiement: 'CASH',
        total: 100,
      },
    ];

    const { service } = buildService({ client: baseClient, ventes });

    const result = await service.findCustomer({
      tenantId: 'tenant-1',
      identifier: phoneIdentifier,
      requestId: 'req-1',
      limit: 2,
    });

    expect(result.found).toBe(true);
    if (!result.found) throw new Error('résultat inattendu : found=false');

    expect(result.history.items).toHaveLength(2);
    expect(result.history.limit).toBe(2);
    expect(result.history.hasMore).toBe(true);
    expect(result.history.items[0].total).toBe('1500.50');
    expect(result.history.nextCursor).toBe(
      encodeHistoryCursor({ date: '2026-09-02T10:00:00.000Z', id: 'v2' }),
    );
    expect(result.metaDataFlat).toEqual({ 'preferences.couleur': 'rouge' });
    expect(result.customer.nom).toBe('Awa');
  });

  it('applique le plafond de pagination du shop (borne serveur)', async () => {
    const { service, prisma } = buildService({
      client: baseClient,
      tenant: { parametres: { crm: { history: { maxLimit: 5 } } } },
    });

    await service.findCustomer({
      tenantId: 'tenant-1',
      identifier: phoneIdentifier,
      requestId: 'req-1',
      limit: 40,
    });

    // limit borné à 5, plus la ligne supplémentaire qui détecte la page suivante.
    expect(prisma.vente.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 6 }),
    );
  });

  it('calcule la créance de consigne avec le référentiel du shop', async () => {
    const { service } = buildService({
      client: baseClient,
      consignes: [
        { quantite: 3, typeConsigne: { type: 'CASIER', valeurXAF: 500 } },
      ],
      loyalty: { points: 120, niveau: 'ARGENT', totalDepense: 125000.75 },
    });

    const result = await service.findCustomer({
      tenantId: 'tenant-1',
      identifier: phoneIdentifier,
      requestId: 'req-1',
    });

    if (!result.found) throw new Error('résultat inattendu : found=false');

    expect(result.consignes).toEqual([
      {
        typeConsigne: 'CASIER',
        quantiteEnCirculation: 3,
        valeurUnitaire: '500.00',
        montantEnCirculation: '1500.00',
      },
    ]);
    expect(result.loyalty).toEqual({
      points: 120,
      niveau: 'ARGENT',
      totalDepense: '125000.75',
    });
  });
});