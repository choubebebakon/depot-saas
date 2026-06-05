import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma.service';
import { CampayService } from './campay.service';
import { NotchPayService } from './notchpay.service';
import { StripePaymentsService } from './stripe.service';
import { InvoicesService } from '../invoices/invoices.service';
import { EmailService } from '../common/email/email.service';
import { NotificationsService } from '../core/notifications/notifications.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: {} },
        { provide: CampayService, useValue: {} },
        { provide: NotchPayService, useValue: {} },
        { provide: StripePaymentsService, useValue: {} },
        { provide: InvoicesService, useValue: {} },
        {
          provide: EmailService,
          useValue: {
            sendPaymentFailed: jest.fn(),
            sendPaymentConfirmation: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            createFromTemplate: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('Calculs TVA (Cameroun 19.25%)', () => {
    it('doit calculer correctement le montant TTC pour un plan SOLO (20 000 XAF HT)', () => {
      const ht = 20000;
      const tvaRate = 0.1925;
      const tva = Math.round(ht * tvaRate);
      const ttc = ht + tva;

      expect(tva).toBe(3850);
      expect(ttc).toBe(23850);
    });

    it('doit calculer correctement le montant TTC pour un plan PME (50 000 XAF HT)', () => {
      const ht = 50000;
      const tvaRate = 0.1925;
      const tva = Math.round(ht * tvaRate);
      const ttc = ht + tva;

      expect(tva).toBe(9625);
      expect(ttc).toBe(59625);
    });
  });
});

