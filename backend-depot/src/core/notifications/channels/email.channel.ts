import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotifType } from '@prisma/client';

@Injectable()
export class EmailChannel {
  private readonly logger = new Logger(EmailChannel.name);
  private transporter: any;
  private initialized = false;

  constructor(private configService: ConfigService) {
    this.initTransporter();
  }

  private initTransporter(): void {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user) {
      this.logger.warn('SMTP non configuré — emails désactivés');
      return;
    }

    try {
      const nodemailer = require('nodemailer');
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.initialized = true;
      this.logger.log('EmailChannel initialisé (SMTP)');
    } catch (e) {
      this.logger.error('Impossible d\'initialiser Nodemailer');
    }
  }

  private getFromAddress(): string {
    return this.configService.get<string>('SMTP_FROM', 'noreply@gestock.cm');
  }

  private getAppName(): string {
    return this.configService.get<string>('APP_NAME', 'GeStock SaaS');
  }

  async send(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.initialized || !this.transporter) {
      this.logger.log(`[EMAIL LOG] To: ${to} | Subject: ${subject}`);
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: `"${this.getAppName()}" <${this.getFromAddress()}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email envoyé à ${to}: ${subject}`);
      return true;
    } catch (e: any) {
      this.logger.error(`Échec envoi email à ${to}: ${e.message}`);
      return false;
    }
  }

  async sendTemplate(to: string, type: NotifType, data: Record<string, unknown>): Promise<boolean> {
    const subject = this.buildSubject(type, data);
    const html = this.buildHtml(type, data);
    return this.send(to, subject, html);
  }

  private buildSubject(type: NotifType, data: Record<string, unknown>): string {
    const subjects: Partial<Record<NotifType, string>> = {
      STOCK_CRITIQUE: '⚠️ Stock critique — Action requise',
      STOCK_RUPTURE: '🚫 Rupture de stock détectée',
      STOCK_EXPIRATION: '📅 Produits proches de l\'expiration',
      PAYMENT_SUCCESS: '✅ Paiement confirmé',
      PAYMENT_FAILED: '❌ Paiement échoué',
      EXPIRY_J7: `⏰ Votre abonnement expire dans 7 jours`,
      EXPIRY_J3: `⚠️ Votre abonnement expire dans 3 jours`,
      EXPIRY_J1: `🚨 Dernier jour — Abonnement expire demain`,
      RAPPORT_JOURNALIER: '📊 Votre rapport journalier GeStock',
      ALERTE_PREDICTIVE: '🔮 Alerte prédictive GeStock',
    };
    return subjects[type] || `Notification GeStock — ${type}`;
  }

  private buildHtml(type: NotifType, data: Record<string, unknown>): string {
    const appName = this.getAppName();
    const message = data.message || 'Vous avez une nouvelle notification GeStock.';

    return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9">
<tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)">
<tr><td style="background:linear-gradient(135deg,#1e293b,#0f172a);padding:32px 40px;text-align:center">
<h1 style="color:#fff;font-size:20px;margin:0;font-weight:700">${appName}</h1>
</td></tr>
<tr><td style="padding:32px 40px">
<h2 style="color:#1e293b;font-size:20px;margin:0 0 16px">${data.title || 'Notification'}</h2>
<p style="color:#475569;font-size:16px;line-height:1.6;margin:0">${message}</p>
${data.actionUrl ? `<div style="margin-top:24px"><a href="${data.actionUrl}" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600">${data.actionLabel || 'Voir'}</a></div>` : ''}
</td></tr>
<tr><td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center">
<p style="color:#94a3b8;font-size:12px;margin:0">Cet email a été envoyé automatiquement par ${appName}. Merci de ne pas y répondre.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
  }
}
