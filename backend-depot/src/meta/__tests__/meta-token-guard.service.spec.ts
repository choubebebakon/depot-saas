import { MetaTokenGuardService } from '../services/meta-token-guard.service';
import { loadMetaConfig } from '../meta.config';

describe('MetaTokenGuardService', () => {
  let service: MetaTokenGuardService;
  let mockPrisma: any;
  let mockCrypto: any;
  let mockGraph: any;

  beforeEach(() => {
    mockPrisma = {
      metaIntegration: {
        findMany: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      notification: {
        findFirst: jest.fn(),
        create: jest.fn().mockResolvedValue({}),
      },
    };
    mockCrypto = {
      decrypt: jest.fn().mockReturnValue({ accessToken: 'valid-decrypted-token', registerPin: '123456' }),
      encrypt: jest.fn().mockReturnValue('encrypted-string'),
    };
    mockGraph = {
      debugToken: jest.fn(),
      verifyWabaSubscription: jest.fn(),
      subscribeAppToWaba: jest.fn(),
    };

    service = new MetaTokenGuardService(
      mockPrisma,
      mockCrypto,
      mockGraph,
      loadMetaConfig(),
    );
  });

  describe('checkAllWebhookSubscriptions (GAP 3 / Contrainte n°8)', () => {
    it('met à jour webhookSubscriptionVerifiedAt si déjà abonné', async () => {
      mockPrisma.metaIntegration.findMany.mockResolvedValue([
        {
          id: 'int-1',
          tenantId: 'tenant-1',
          wabaId: 'waba-100',
          encryptedAccessToken: 'enc-token',
        },
      ]);
      mockGraph.verifyWabaSubscription.mockResolvedValue(true);

      await service.checkAllWebhookSubscriptions();

      expect(mockGraph.verifyWabaSubscription).toHaveBeenCalledWith('waba-100', 'valid-decrypted-token');
      expect(mockGraph.subscribeAppToWaba).not.toHaveBeenCalled();
      expect(mockPrisma.metaIntegration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'int-1' },
          data: expect.objectContaining({
            webhookSubscriptionVerifiedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('tente une ré-inscription si abonnement perdu puis met à jour', async () => {
      mockPrisma.metaIntegration.findMany.mockResolvedValue([
        {
          id: 'int-2',
          tenantId: 'tenant-2',
          wabaId: 'waba-200',
          encryptedAccessToken: 'enc-token-2',
        },
      ]);
      // First check returns false, after re-subscribing returns true
      mockGraph.verifyWabaSubscription
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);
      mockGraph.subscribeAppToWaba.mockResolvedValue(true);

      await service.checkAllWebhookSubscriptions();

      expect(mockGraph.subscribeAppToWaba).toHaveBeenCalledWith('waba-200', 'valid-decrypted-token');
      expect(mockPrisma.metaIntegration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'int-2' },
          data: expect.objectContaining({
            webhookSubscriptionVerifiedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('notifyExpiringTokens (GAP 4 / Contrainte n°9)', () => {
    it('crée une notification pour un token expirant bientôt', async () => {
      const futureDate = new Date(Date.now() + 3 * 24 * 3600 * 1000); // 3 jours
      mockPrisma.metaIntegration.findMany.mockResolvedValue([
        {
          id: 'int-3',
          tenantId: 'tenant-3',
          tokenExpiresAt: futureDate,
          displayPhoneNumber: '+237600000000',
        },
      ]);
      mockPrisma.notification.findFirst.mockResolvedValue(null);

      await service.notifyExpiringTokens();

      expect(mockPrisma.metaIntegration.update).toHaveBeenCalledWith({
        where: { id: 'int-3' },
        data: { lastCheckStatus: 'EXPIRING_SOON' },
      });

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-3',
          type: 'META_TOKEN_EXPIRING',
          category: 'SYSTEM',
          priority: 'HIGH',
        }),
      });
    });

    it('ne crée pas de doublon si une notification a déjà été envoyée dans les dernières 24h', async () => {
      const futureDate = new Date(Date.now() + 2 * 24 * 3600 * 1000);
      mockPrisma.metaIntegration.findMany.mockResolvedValue([
        {
          id: 'int-4',
          tenantId: 'tenant-4',
          tokenExpiresAt: futureDate,
          displayPhoneNumber: '+237600000000',
        },
      ]);
      mockPrisma.notification.findFirst.mockResolvedValue({ id: 'existing-notif' });

      await service.notifyExpiringTokens();

      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });
  });
});
