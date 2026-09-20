import { MetaGraphApiService } from '../services/meta-graph-api.service';
import type { MetaConfig } from '../meta.config';
import { of } from 'rxjs';
import { createHmac } from 'node:crypto';

describe('MetaGraphApiService', () => {
  let service: MetaGraphApiService;
  let mockHttp: any;
  // Fixture aligné sur l'interface MetaConfig RÉELLE (src/meta/meta.config.ts) :
  // le champ s'appelle `verifyToken` (et non `webhookVerifyToken`) et
  // `isProduction` est requis. `tokenEncryptionKey` n'en fait PAS partie — la
  // clé AES est lue séparément (META_TOKEN_ENCRYPTION_KEY) par le service de
  // chiffrement des jetons, pas par le client Graph API.
  // Secret de test typé `string` : `MetaConfig.appSecret` est `string | null`
  // (une config peut être partielle), alors que `createHmac` exige un
  // BinaryLike non nullable. On réutilise donc cette constante typée dans les
  // assertions plutôt qu'une assertion non-null `!`.
  const appSecret = 'test_secret_key';
  const config: MetaConfig = {
    appId: '123456789',
    appSecret,
    verifyToken: 'test_verify_token',
    configId: 'test_config_id',
    graphVersion: 'v21.0',
    isProduction: false,
    requiredScopes: ['whatsapp_business_management'],
  };

  beforeEach(() => {
    mockHttp = {
      get: jest.fn(),
      post: jest.fn(),
    };
    service = new MetaGraphApiService(mockHttp, config);
  });

  describe('appsecret_proof (GAP 1 / Contrainte n°10)', () => {
    it('inclut appsecret_proof dans les requêtes GET avec token utilisateur', async () => {
      const expectedProof = createHmac('sha256', appSecret).update('user_token').digest('hex');

      mockHttp.get.mockReturnValue(of({ data: { id: 'phone-123' } }));

      await service.getPhoneNumberInfo('phone-123', 'user_token');

      expect(mockHttp.get).toHaveBeenCalledTimes(1);
      const [url, options] = mockHttp.get.mock.calls[0];
      expect(url).toContain('/phone-123');
      expect(options.params.get('access_token')).toBe('user_token');
      expect(options.params.get('appsecret_proof')).toBe(expectedProof);
    });

    it('inclut appsecret_proof dans les requêtes POST avec token utilisateur', async () => {
      const expectedProof = createHmac('sha256', appSecret).update('user_token').digest('hex');

      mockHttp.post.mockReturnValue(of({ data: { success: true } }));

      await service.subscribeAppToWaba('waba-456', 'user_token');

      expect(mockHttp.post).toHaveBeenCalledTimes(1);
      const [url] = mockHttp.post.mock.calls[0];
      expect(url).toContain(`/waba-456/subscribed_apps?appsecret_proof=${expectedProof}`);
    });
  });

  describe('verifyWabaSubscription (GAP 1 & 2 / Contrainte n°8)', () => {
    it('renvoie true si appId est dans la liste des applications abonnées', async () => {
      mockHttp.get.mockReturnValue(
        of({
          data: {
            data: [{ id: 'other_app' }, { id: '123456789' }],
          },
        }),
      );

      const result = await service.verifyWabaSubscription('waba-456', 'user_token');
      expect(result).toBe(true);
    });

    it('renvoie false si appId n est pas dans la liste des applications abonnées', async () => {
      mockHttp.get.mockReturnValue(
        of({
          data: {
            data: [{ id: 'other_app_1' }, { id: 'other_app_2' }],
          },
        }),
      );

      const result = await service.verifyWabaSubscription('waba-456', 'user_token');
      expect(result).toBe(false);
    });
  });
});
