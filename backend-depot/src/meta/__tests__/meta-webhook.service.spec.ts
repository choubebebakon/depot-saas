import { MetaWebhookService, MetaWebhookEnvelope } from '../services/meta-webhook.service';
import { loadMetaConfig } from '../meta.config';

/**
 * Tests du webhook Meta (PARTIE 3) :
 *  - signature HMAC-SHA256 calculée sur le CORPS BRUT (fait vérifié n°7) ;
 *  - handshake GET (fait vérifié n°6) ;
 *  - déduplication des livraisons (contrainte n°7).
 */
describe('MetaWebhookService', () => {
  const APP_SECRET = 'test_app_secret';
  const rawBody = Buffer.from(JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [{
      id: '111111111',
      time: 1700000000,
      changes: [{
        field: 'messages',
        value: {
          messaging_product: 'whatsapp',
          metadata: { phone_number_id: '1288589557673808' },
          contacts: [{ profile: { name: 'Awa' }, wa_id: '237655000000' }],
          messages: [{ id: 'wamid.TEST1', from: '237655000000', type: 'text', text: { body: 'Bonjour' } }],
        },
      }],
    }],
  } as MetaWebhookEnvelope), 'utf8');

  const signature = (buf: Buffer, secret = APP_SECRET) =>
    `sha256=${require('node:crypto').createHmac('sha256', secret).update(buf).digest('hex')}`;

  let service: MetaWebhookService;

  beforeEach(() => {
    process.env.META_APP_SECRET = APP_SECRET;
    process.env.META_WEBHOOK_VERIFY_TOKEN = 'verify_me';
    const prisma = { metaWebhookEvent: { create: jest.fn().mockResolvedValue({}) } } as never;
    const integrations = { resolveWebhookSource: jest.fn().mockResolvedValue(null) } as never;
    const graph = {} as never;
    service = new MetaWebhookService(prisma, integrations, graph, loadMetaConfig());
  });

  describe('verifySignature (contrainte n°4 — corps brut)', () => {
    it('valide une signature correcte calculée sur le corps brut', () => {
      expect(service.verifySignature(rawBody, signature(rawBody))).toBe(true);
    });

    it('rejette une signature calculée sur un corps différent (replay/altération)', () => {
      const altered = Buffer.from(rawBody.toString('utf8').replace('Bonjour', 'Bonjour '));
      // Un seul octet modifié : la signature doit échouer (le HMAC couvre le
      // corps exact, pas une version approximative).
      expect(service.verifySignature(rawBody, signature(altered))).toBe(false);
    });

    it('rejette une signature d’un autre secret', () => {
      expect(service.verifySignature(rawBody, signature(rawBody, 'other_secret'))).toBe(false);
    });

    it('rejette un en-tête absent ou mal formé', () => {
      expect(service.verifySignature(rawBody, undefined)).toBe(false);
      expect(service.verifySignature(rawBody, 'sha1=deadbeef')).toBe(false);
      expect(service.verifySignature(undefined, signature(rawBody))).toBe(false);
    });
  });

  describe('verifyHandshake (fait vérifié n°6)', () => {
    it('renvoie le challenge si mode + token correspondent', () => {
      expect(service.verifyHandshake('subscribe', 'verify_me', 'CHALL-123')).toBe('CHALL-123');
    });

    it('renvoie null sinon', () => {
      expect(service.verifyHandshake('unsubscribe', 'verify_me', 'CHALL')).toBeNull();
      expect(service.verifyHandshake('subscribe', 'wrong', 'CHALL')).toBeNull();
      expect(service.verifyHandshake('subscribe', undefined, 'CHALL')).toBeNull();
    });
  });

  describe('déduplication (contrainte n°7)', () => {
    it('construit une clé stable par (entryId, messageId)', () => {
      const envelope = JSON.parse(rawBody.toString('utf8')) as MetaWebhookEnvelope;
      expect(service.buildEventKey(envelope)).toBe('111111111:wamid.TEST1');
      expect(service.buildEventKey({})).toBe('');
    });

    it('reserveEvent renvoie false en cas de doublon (P2002)', async () => {
      const prisma = {
        metaWebhookEvent: {
          create: jest.fn().mockRejectedValue(Object.assign(new Error('dup'), { code: 'P2002' })),
        },
      } as never;
      const integrations = {} as never;
      const graph = {} as never;
      const svc = new MetaWebhookService(prisma, integrations, graph, loadMetaConfig());
      await expect(svc.reserveEvent('k', '111')).resolves.toBe(false);
    });
  });
});
