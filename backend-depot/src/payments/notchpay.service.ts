import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class NotchPayService {
  private readonly logger = new Logger(NotchPayService.name);

  getWebhookSecret(): string {
    return process.env.NOTCHPAY_WEBHOOK_SECRET || 'secret';
  }

  /**
   * Verify NotchPay webhook signature using HMAC SHA256
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const secret = this.getWebhookSecret();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  async initializePayment(data: any) {
    try {
      this.logger.log(`Body envoye a NotchPay: ${JSON.stringify(data)}`);
      const notchPayUrl = `${process.env.NOTCHPAY_ENDPOINT || 'https://api.notchpay.co'}/payments/initialize`;
      this.logger.log(`URL NotchPay: ${notchPayUrl}`);

      // Include metadata with tenantId and plan for webhook processing
      const payload = {
        ...data,
        meta: {
          tenantId: data.tenantId,
          plan: data.plan,
          email: data.customer?.email,
        },
      };

      const response = await axios.post(notchPayUrl, payload, {
        headers: {
          Authorization: process.env.NOTCHPAY_PRIVATE_KEY,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Erreur NotchPay detaillee: ${JSON.stringify(error.response?.data || error.response?.body || error.message)}`,
      );
      throw new Error('Erreur API NotchPay');
    }
  }
}
