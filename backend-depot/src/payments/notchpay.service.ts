import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NotchPayService {
  private readonly logger = new Logger(NotchPayService.name);

  getWebhookHashKey(): string {
    return process.env.NOTCHPAY_WEBHOOK_KEY || 'secret';
  }

  async initializePayment(data: any) {
    try {
      this.logger.log(`Body envoye a NotchPay: ${JSON.stringify(data)}`);
      const notchPayUrl = `${process.env.NOTCHPAY_ENDPOINT || 'https://api.notchpay.co'}/payments/initialize`;
      this.logger.log(`URL NotchPay: ${notchPayUrl}`);
      const response = await axios.post(notchPayUrl, data, {
        headers: { 
            'Authorization': process.env.NOTCHPAY_PUBLIC_KEY,
            'Content-Type': 'application/json' 
        }
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(`Erreur NotchPay detaillee: ${JSON.stringify(error.response?.data || error.response?.body || error.message)}`);
      throw new Error('Erreur API NotchPay');
    }
  }
}
