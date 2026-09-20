import { createHmac } from 'node:crypto';
import type { Request } from 'express';
import { PrismaService } from '../../prisma.service';
import { CrmApiKeyService } from '../crm-api-key.service';
import { CrmError } from '../crm-errors';
import { CrmLogger } from '../crm-logger.service';

const PEPPER = 'test-pepper';
const VALID_RAW_KEY = `gsk_crm_${'a'.repeat(43)}`;

interface FakeKeyRow {
  id: string;
  tenantId: string;
  keyHash: string;
  keyPrefix: string;
  isActive: boolean;
  allowedChannels: string[];
  expiresAt: Date | null;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
}

function hashWithPepper(raw: string): string {
  return createHmac('sha256', PEPPER).update(raw, 'utf8').digest('hex');
}

function buildKeyRow(overrides: Partial<FakeKeyRow> = {}): FakeKeyRow {
  return {
    id: 'key-1',
    tenantId: 'tenant-1',
    keyHash: hashWithPepper(VALID_RAW_KEY),
    keyPrefix: VALID_RAW_KEY.slice(0, 16),
    isActive: true,
    allowedChannels: [],
    expiresAt: null,
    revokedAt: null,
    lastUsedAt: null,
    ...overrides,
  };
}

function buildService(row: FakeKeyRow | null) {
  const prisma = {
    crmApiKey: {
      findUnique: jest.fn().mockResolvedValue(row),
      update: jest.fn().mockResolvedValue({}),
    },
  } as unknown as PrismaService;

  return {
    service: new CrmApiKeyService(prisma, new CrmLogger()),
    prisma,
  };
}

function buildRequest(
  headers: Record<string, string>,
  rawBody?: Buffer,
): Request {
  return { headers, rawBody } as unknown as Request;
}

describe('CrmApiKeyService', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env, CRM_API_KEY_PEPPER: PEPPER };
    delete process.env.META_APP_SECRET;
    delete process.env.META_WEBHOOK_SIGNATURE_MODE;
  });

  afterAll(() => {
    process.env = env;
  });

  it('generateKey produit une clé conforme et jamais deux fois la même', () => {
    const { service } = buildService(null);
    const first = service.generateKey();
    const second = service.generateKey();

    expect(first.raw).toMatch(/^gsk_crm_[A-Za-z0-9_-]{43}$/);
    expect(first.keyPrefix).toBe(first.raw.slice(0, 16));
    expect(first.raw).not.toBe(second.raw);
    expect(first.keyHash).toHaveLength(64);
  });

  it('hashKey est déterministe et ne laisse jamais fuiter la clé brute', () => {
    const { service } = buildService(null);

    expect(service.hashKey(VALID_RAW_KEY)).toBe(hashWithPepper(VALID_RAW_KEY));
    expect(service.hashKey(VALID_RAW_KEY)).not.toContain(VALID_RAW_KEY);
    expect(service.hashKey(`${VALID_RAW_KEY}b`)).not.toBe(
      service.hashKey(VALID_RAW_KEY),
    );
  });

  it('refuse une requête sans en-tête x-api-key (401)', async () => {
    const { service } = buildService(null);

    await expect(service.resolve(buildRequest({}), 'req-1')).rejects.toThrow(
      CrmError,
    );
  });

  it('refuse une clé malformée SANS interroger la base (pas d’oracle)', async () => {
    const { service, prisma } = buildService(null);

    await expect(
      service.resolve(buildRequest({ 'x-api-key': 'clé-bidon' }), 'req-1'),
    ).rejects.toThrow(/invalide/i);

    expect(prisma.crmApiKey.findUnique).not.toHaveBeenCalled();
  });

  it('résout une clé active en tenantId et journalise un lastUsedAt', async () => {
    const { service, prisma } = buildService(buildKeyRow());

    const resolved = await service.resolve(
      buildRequest({ 'x-api-key': VALID_RAW_KEY }),
      'req-1',
    );

    expect(resolved).toEqual({
      apiKeyId: 'key-1',
      tenantId: 'tenant-1',
      allowedChannels: [],
      keyPrefix: VALID_RAW_KEY.slice(0, 16),
    });
    expect(prisma.crmApiKey.update).toHaveBeenCalledTimes(1);
  });

  it('refuse une clé inconnue, révoquée, inactive ou expirée (401)', async () => {
    await expect(
      buildService(null).service.resolve(
        buildRequest({ 'x-api-key': VALID_RAW_KEY }),
        'req-1',
      ),
    ).rejects.toThrow(/inconnue/i);

    await expect(
      buildService(buildKeyRow({ revokedAt: new Date() })).service.resolve(
        buildRequest({ 'x-api-key': VALID_RAW_KEY }),
        'req-1',
      ),
    ).rejects.toThrow(/révoquée/i);

    await expect(
      buildService(buildKeyRow({ isActive: false })).service.resolve(
        buildRequest({ 'x-api-key': VALID_RAW_KEY }),
        'req-1',
      ),
    ).rejects.toThrow(/révoquée/i);

    await expect(
      buildService(
        buildKeyRow({ expiresAt: new Date(Date.now() - 1000) }),
      ).service.resolve(buildRequest({ 'x-api-key': VALID_RAW_KEY }), 'req-1'),
    ).rejects.toThrow(/expirée/i);
  });

  it('applique le moindre privilège sur les canaux', () => {
    const { service } = buildService(null);
    const scopedKey = {
      apiKeyId: 'key-1',
      tenantId: 'tenant-1',
      allowedChannels: ['WHATSAPP'] as const,
      keyPrefix: 'gsk_crm_00000000',
    };

    expect(() =>
      service.assertChannelAllowed(scopedKey, 'WHATSAPP', 'req-1'),
    ).not.toThrow();
    expect(() =>
      service.assertChannelAllowed(scopedKey, 'INSTAGRAM', 'req-1'),
    ).toThrow(/autorisée/i);

    // Liste vide = tous les canaux du tenant (règle documentée).
    expect(() =>
      service.assertChannelAllowed(
        { ...scopedKey, allowedChannels: [] },
        'INSTAGRAM',
        'req-1',
      ),
    ).not.toThrow();
  });
});