import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhatsAppChannel {
  private readonly logger = new Logger(WhatsAppChannel.name);
  private initialized = false;
  private apiUrl: string;
  private token: string;
  private phoneId: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('WHATSAPP_API_URL', 'https://graph.facebook.com/v18.0');
    this.token = this.configService.get<string>('WHATSAPP_TOKEN', '');
    this.phoneId = this.configService.get<string>('WHATSAPP_PHONE_ID', '');

    if (this.token && this.phoneId) {
      this.initialized = true;
      this.logger.log('WhatsAppChannel initialisé');
    } else {
      this.logger.warn('WHATSAPP_TOKEN ou WHATSAPP_PHONE_ID manquant — WhatsApp désactivé (mode dégradé)');
    }
  }

  private formatNumero(tel: string): string {
    const cleaned = tel.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('237') && cleaned.length === 12) return cleaned;
    if (cleaned.length === 9) return `237${cleaned}`;
    return cleaned;
  }

  async send(to: string, message: string): Promise<boolean> {
    if (!this.initialized) {
      this.logger.log(`[WHATSAPP LOG] To: ${to} | Message: ${message.substring(0, 80)}...`);
      return true;
    }

    try {
      const axios = require('axios');
      const numero = this.formatNumero(to);

      await axios.post(
        `${this.apiUrl}/${this.phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: numero,
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`WhatsApp envoyé à ${numero}`);
      return true;
    } catch (e: any) {
      this.logger.error(`Échec WhatsApp vers ${to}: ${e.message}`);
      return false;
    }
  }
}
