import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private sendgridClient: any;
  private nodemailerTransporter: any;
  private provider: 'sendgrid' | 'nodemailer' | 'log';

  constructor(private configService: ConfigService) {
    this.provider =
      (this.configService.get<string>('EMAIL_PROVIDER') as
        | 'sendgrid'
        | 'nodemailer'
        | 'log') || 'log';
  }

  async onModuleInit() {
    if (this.provider === 'sendgrid') {
      const sgMail = require('@sendgrid/mail');
      const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
      if (apiKey) {
        sgMail.setApiKey(apiKey);
        this.sendgridClient = sgMail;
        this.logger.log('SendGrid initialisé');
      } else {
        this.logger.warn('SENDGRID_API_KEY non définie, fallback sur log');
        this.provider = 'log';
      }
    } else if (this.provider === 'nodemailer') {
      const nodemailer = require('nodemailer');
      this.nodemailerTransporter = nodemailer.createTransport({
        host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
        port: this.configService.get<number>('SMTP_PORT', 587),
        secure:
          this.configService.get<string>('SMTP_SECURE', 'false') === 'true',
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });
      this.logger.log('Nodemailer initialisé');
    } else {
      this.logger.log('Email provider: log (aucun email réel envoyé)');
    }
  }

  private getFromAddress(): string {
    return this.configService.get<string>('EMAIL_FROM', 'noreply@gestock.cm');
  }

  private getAppName(): string {
    return this.configService.get<string>('APP_NAME', 'GeStock SaaS');
  }

  private getFrontendUrl(): string {
    return this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5174',
    );
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (this.provider === 'sendgrid' && this.sendgridClient) {
      try {
        await this.sendgridClient.send({
          to: options.to,
          from: this.getFromAddress(),
          subject: options.subject,
          html: options.html,
          attachments: options.attachments?.map((a) => ({
            filename: a.filename,
            content: Buffer.isBuffer(a.content)
              ? a.content.toString('base64')
              : Buffer.from(a.content).toString('base64'),
            type: a.contentType || 'application/octet-stream',
            disposition: 'attachment',
          })),
        });
        this.logger.log(
          `Email envoyé à ${options.to} via SendGrid: ${options.subject}`,
        );
      } catch (err: any) {
        this.logger.error(
          `Échec SendGrid pour ${options.to}: ${err.message}`,
          err.stack,
        );
        throw err;
      }
    } else if (this.provider === 'nodemailer' && this.nodemailerTransporter) {
      try {
        await this.nodemailerTransporter.sendMail({
          from: `"${this.getAppName()}" <${this.getFromAddress()}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
          attachments: options.attachments,
        });
        this.logger.log(
          `Email envoyé à ${options.to} via SMTP: ${options.subject}`,
        );
      } catch (err: any) {
        this.logger.error(
          `Échec SMTP pour ${options.to}: ${err.message}`,
          err.stack,
        );
        throw err;
      }
    } else {
      this.logger.log(
        `[EMAIL LOG] To: ${options.to} | Subject: ${options.subject}`,
      );
      this.logger.debug(
        `[EMAIL LOG] Body: ${options.html.substring(0, 200)}...`,
      );
    }
  }

  async sendWelcomeEmail(
    to: string,
    companyName: string,
    loginUrl?: string,
  ): Promise<void> {
    const appName = this.getAppName();
    const url = loginUrl || `${this.getFrontendUrl()}/login`;
    const html = this.buildTemplate({
      title: `Bienvenue sur ${appName} !`,
      preheader: `Votre compte ${companyName} est prêt.`,
      content: `
        <h1 style="color:#1e293b;font-size:24px;margin:0 0 16px">Bienvenue, <span style="color:#3b82f6">${companyName}</span> !</h1>
        <p style="color:#475569;font-size:16px;line-height:1.6">Nous sommes ravis de vous accueillir sur <strong>${appName}</strong>. Votre compte a été créé avec succès et vous pouvez dès maintenant commencer à gérer votre activité.</p>
        <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:24px 0">
          <p style="color:#1e293b;font-size:15px;margin:0 0 12px;font-weight:600">Prochaines étapes :</p>
          <ol style="color:#475569;font-size:14px;line-height:1.8;padding-left:20px;margin:0">
            <li>Configurez vos dépôts et articles</li>
            <li>Ajoutez vos clients et fournisseurs</li>
            <li>Commencez à enregistrer vos ventes</li>
            <li>Explorez les fonctionnalités avancées (tournées, consignes, DLC…)</li>
          </ol>
        </div>
        <a href="${url}" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600">Se connecter</a>
      `,
    });
    await this.sendEmail({ to, subject: `Bienvenue sur ${appName} !`, html });
  }

  async sendPaymentConfirmation(
    to: string,
    companyName: string,
    amount: number,
    planType: string,
    paymentDate: Date,
    nextBillingDate?: Date,
  ): Promise<void> {
    const appName = this.getAppName();
    const formattedAmount = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
    }).format(amount);
    const nextBill = nextBillingDate
      ? nextBillingDate.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'Non spécifié';
    const html = this.buildTemplate({
      title: `Paiement confirmé - ${planType}`,
      preheader: `Votre paiement de ${formattedAmount} a été reçu.`,
      content: `
        <h1 style="color:#1e293b;font-size:24px;margin:0 0 16px">✅ Paiement confirmé</h1>
        <p style="color:#475569;font-size:16px;line-height:1.6">Bonjour <strong>${companyName}</strong>,</p>
        <p style="color:#475569;font-size:16px;line-height:1.6">Nous avons bien reçu votre paiement de <strong style="color:#059669;font-size:20px">${formattedAmount}</strong> pour le forfait <strong>${planType}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:24px 0;background:#f8fafc;border-radius:12px">
          <tr><td style="padding:12px 20px;color:#64748b;font-size:14px">Montant</td><td style="padding:12px 20px;color:#1e293b;font-size:14px;font-weight:600;text-align:right">${formattedAmount}</td></tr>
          <tr><td style="padding:12px 20px;color:#64748b;font-size:14px;border-top:1px solid #e2e8f0">Forfait</td><td style="padding:12px 20px;color:#1e293b;font-size:14px;font-weight:600;text-align:right;border-top:1px solid #e2e8f0">${planType}</td></tr>
          <tr><td style="padding:12px 20px;color:#64748b;font-size:14px;border-top:1px solid #e2e8f0">Date</td><td style="padding:12px 20px;color:#1e293b;font-size:14px;text-align:right;border-top:1px solid #e2e8f0">${paymentDate.toLocaleDateString('fr-FR')}</td></tr>
          <tr><td style="padding:12px 20px;color:#64748b;font-size:14px;border-top:1px solid #e2e8f0">Prochaine facturation</td><td style="padding:12px 20px;color:#1e293b;font-size:14px;text-align:right;border-top:1px solid #e2e8f0">${nextBill}</td></tr>
        </table>
        <p style="color:#64748b;font-size:14px;line-height:1.6">Merci de votre confiance ! L'équipe ${appName} reste à votre disposition.</p>
      `,
    });
    await this.sendEmail({
      to,
      subject: `✅ Paiement confirmé - ${planType} - ${formattedAmount}`,
      html,
    });
  }

  async sendPaymentFailed(
    to: string,
    companyName: string,
    amount: number,
    planType: string,
    reason?: string,
  ): Promise<void> {
    const appName = this.getAppName();
    const formattedAmount = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
    }).format(amount);
    const html = this.buildTemplate({
      title: `Échec du paiement - ${planType}`,
      preheader: `Votre paiement de ${formattedAmount} a échoué.`,
      content: `
        <h1 style="color:#1e293b;font-size:24px;margin:0 0 16px">❌ Paiement échoué</h1>
        <p style="color:#475569;font-size:16px;line-height:1.6">Bonjour <strong>${companyName}</strong>,</p>
        <p style="color:#475569;font-size:16px;line-height:1.6">Votre paiement de <strong style="color:#dc2626">${formattedAmount}</strong> pour le forfait <strong>${planType}</strong> n'a pas pu être traité.</p>
        ${reason ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:24px 0"><p style="color:#dc2626;font-size:14px;margin:0"><strong>Raison :</strong> ${reason}</p></div>` : ''}
        <p style="color:#475569;font-size:16px;line-height:1.6">Veuillez vérifier vos informations de paiement et réessayer depuis votre tableau de bord.</p>
        <a href="${this.getFrontendUrl()}/settings/billing" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600">Réessayer le paiement</a>
      `,
    });
    await this.sendEmail({
      to,
      subject: `❌ Échec du paiement - ${planType}`,
      html,
    });
  }

  async sendExpiryReminder(
    to: string,
    companyName: string,
    daysLeft: number,
    subscriptionEnd: Date,
    planType: string,
  ): Promise<void> {
    const appName = this.getAppName();
    const formattedDate = subscriptionEnd.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const urgency =
      daysLeft <= 1 ? 'urgente' : daysLeft <= 3 ? 'importante' : '';
    const bgColor =
      daysLeft <= 1 ? '#fef2f2' : daysLeft <= 3 ? '#fff7ed' : '#f0f9ff';
    const borderColor =
      daysLeft <= 1 ? '#fecaca' : daysLeft <= 3 ? '#fed7aa' : '#bae6fd';
    const textColor =
      daysLeft <= 1 ? '#dc2626' : daysLeft <= 3 ? '#c2410c' : '#0369a1';
    const html = this.buildTemplate({
      title: `Votre abonnement expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`,
      preheader: `Plus que ${daysLeft} jour${daysLeft > 1 ? 's' : ''} avant l'expiration de votre abonnement ${planType}.`,
      content: `
        <h1 style="color:#1e293b;font-size:24px;margin:0 0 16px">⏰ Rappel d'expiration</h1>
        <p style="color:#475569;font-size:16px;line-height:1.6">Bonjour <strong>${companyName}</strong>,</p>
        <p style="color:#475569;font-size:16px;line-height:1.6">Votre abonnement <strong>${planType}</strong> expire dans <strong style="color:${textColor}">${daysLeft} jour${daysLeft > 1 ? 's' : ''}</strong>, soit le <strong>${formattedDate}</strong>.</p>
        <div style="background:${bgColor};border:1px solid ${borderColor};border-radius:12px;padding:24px;margin:24px 0;text-align:center">
          <p style="color:${textColor};font-size:28px;font-weight:700;margin:0 0 8px">J-${daysLeft}</p>
          <p style="color:#64748b;font-size:14px;margin:0">${urgency ? `Action ${urgency} requise` : 'Pensez à renouveler'}</p>
        </div>
        <p style="color:#475569;font-size:16px;line-height:1.6">Pour continuer à utiliser ${appName} sans interruption, merci de renouveler votre abonnement dès maintenant.</p>
        <a href="${this.getFrontendUrl()}/settings/billing" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600">Renouveler mon abonnement</a>
      `,
    });
    const urgencyPrefix =
      daysLeft <= 1 ? 'URGENT - ' : daysLeft <= 3 ? 'IMPORTANT - ' : '';
    await this.sendEmail({
      to,
      subject: `${urgencyPrefix}Votre abonnement expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`,
      html,
    });
  }

  async sendInvoiceEmail(
    to: string,
    companyName: string,
    invoiceNumber: string,
    amount: number,
    pdfBuffer: Buffer,
  ): Promise<void> {
    const appName = this.getAppName();
    const formattedAmount = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
    }).format(amount);
    const html = this.buildTemplate({
      title: `Votre facture ${invoiceNumber}`,
      preheader: `Facture ${invoiceNumber} - ${formattedAmount}`,
      content: `
        <h1 style="color:#1e293b;font-size:24px;margin:0 0 16px">📄 Votre facture</h1>
        <p style="color:#475569;font-size:16px;line-height:1.6">Bonjour <strong>${companyName}</strong>,</p>
        <p style="color:#475569;font-size:16px;line-height:1.6">Veuillez trouver ci-joint votre facture <strong>${invoiceNumber}</strong> d'un montant de <strong style="color:#059669">${formattedAmount}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:24px 0;background:#f8fafc;border-radius:12px">
          <tr><td style="padding:12px 20px;color:#64748b;font-size:14px">Numéro</td><td style="padding:12px 20px;color:#1e293b;font-size:14px;font-weight:600;text-align:right">${invoiceNumber}</td></tr>
          <tr><td style="padding:12px 20px;color:#64748b;font-size:14px;border-top:1px solid #e2e8f0">Montant</td><td style="padding:12px 20px;color:#1e293b;font-size:14px;font-weight:600;text-align:right;border-top:1px solid #e2e8f0">${formattedAmount}</td></tr>
        </table>
        <p style="color:#64748b;font-size:14px;line-height:1.6">La facture est également disponible dans votre tableau de bord. Merci de votre confiance !</p>
      `,
    });
    await this.sendEmail({
      to,
      subject: `📄 Votre facture ${invoiceNumber} - ${appName}`,
      html,
      attachments: [
        {
          filename: `facture-${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  async sendCommissionPaid(
    to: string,
    commercialName: string,
    amount: number,
    period: string,
  ): Promise<void> {
    const appName = this.getAppName();
    const formattedAmount = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
    }).format(amount);
    const html = this.buildTemplate({
      title: `Commission payée - ${period}`,
      preheader: `Votre commission de ${formattedAmount} a été versée.`,
      content: `
        <h1 style="color:#1e293b;font-size:24px;margin:0 0 16px">💰 Commission versée</h1>
        <p style="color:#475569;font-size:16px;line-height:1.6">Bonjour <strong>${commercialName}</strong>,</p>
        <p style="color:#475569;font-size:16px;line-height:1.6">Votre commission d'un montant de <strong style="color:#059669;font-size:20px">${formattedAmount}</strong> pour la période <strong>${period}</strong> vous a été versée.</p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;margin:24px 0;text-align:center">
          <p style="color:#059669;font-size:32px;font-weight:700;margin:0">${formattedAmount}</p>
          <p style="color:#64748b;font-size:14px;margin:8px 0 0">Période : ${period}</p>
        </div>
        <p style="color:#64748b;font-size:14px;line-height:1.6">Continuez vos efforts pour augmenter vos ventes !</p>
      `,
    });
    await this.sendEmail({
      to,
      subject: `💰 Commission versée - ${formattedAmount}`,
      html,
    });
  }

  async sendOnboardingComplete(
    to: string,
    companyName: string,
    metier: string,
  ): Promise<void> {
    const appName = this.getAppName();
    const metierLabels: Record<string, string> = {
      DEPOT_BOISSONS: 'Dépôt de Boissons',
      SUPERMARCHE: 'Supermarché',
      BOUTIQUE: 'Boutique',
      QUINCAILLERIE: 'Quincaillerie',
      PHARMACIE: 'Pharmacie',
      RESTAURANT: 'Restaurant',
      TELEPHONIE: 'Téléphonie',
      PRESSING: 'Pressing',
      CIMENT_BTP: 'Ciment & BTP',
      GARAGE: 'Garage',
      ELEVAGE: 'Élevage',
      CLINIQUE: 'Clinique',
      TRANSPORT: 'Transport',
      IMMOBILIER: 'Immobilier',
      HOTEL: 'Hôtel',
      SALON: 'Salon de Coiffure',
      COSMETIQUE: 'Parfumerie/Cosmétique',
      BOULANGERIE: 'Boulangerie',
      GLACIER: 'Glacier/Snack',
      LIBRAIRIE: 'Librairie/Papeterie',
    };
    const label = metierLabels[metier] || metier;
    const html = this.buildTemplate({
      title: `Configuration terminée - ${label}`,
      preheader: `Votre espace ${label} est configuré.`,
      content: `
        <h1 style="color:#1e293b;font-size:24px;margin:0 0 16px">🎉 Configuration terminée !</h1>
        <p style="color:#475569;font-size:16px;line-height:1.6">Félicitations <strong>${companyName}</strong> !</p>
        <p style="color:#475569;font-size:16px;line-height:1.6">Votre espace <strong style="color:#3b82f6">${label}</strong> est désormais configuré sur <strong>${appName}</strong>. Vous pouvez commencer à utiliser toutes les fonctionnalités adaptées à votre métier.</p>
        <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:24px 0">
          <p style="color:#1e293b;font-size:15px;margin:0 0 12px;font-weight:600">Fonctionnalités clés pour ${label} :</p>
          <ul style="color:#475569;font-size:14px;line-height:1.8;padding-left:20px;margin:0">
            <li>Gestion des stocks et inventaire</li>
            <li>Ventes et encaissement</li>
            <li>Gestion des clients et fournisseurs</li>
            <li>Rapports et analyses</li>
          </ul>
        </div>
        <a href="${this.getFrontendUrl()}/tableau-de-bord" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600">Accéder à mon tableau de bord</a>
      `,
    });
    await this.sendEmail({
      to,
      subject: `🎉 Configuration ${label} terminée !`,
      html,
    });
  }

  private buildTemplate(data: {
    title: string;
    preheader: string;
    content: string;
  }): string {
    const appName = this.getAppName();
    const frontendUrl = this.getFrontendUrl();
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;min-height:100vh">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:32px 40px;text-align:center">
              <h1 style="color:#ffffff;font-size:20px;margin:0;font-weight:700">${appName}</h1>
              <p style="color:#94a3b8;font-size:14px;margin:4px 0 0">${this.configService.get<string>('APP_SLOGAN', 'Solution de gestion intelligente')}</p>
            </td>
          </tr>
          <!-- Preheader -->
          <tr>
            <td style="padding:0 40px">
              <p style="color:#94a3b8;font-size:13px;margin:16px 0 0;display:none">${data.preheader}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px">
              ${data.content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center">
                    <p style="color:#94a3b8;font-size:13px;margin:0 0 8px">
                      ${appName} &mdash; Solution de gestion multi-secteurs
                    </p>
                    <p style="color:#94a3b8;font-size:12px;margin:0 0 8px">
                      <a href="${frontendUrl}" style="color:#3b82f6;text-decoration:none">${frontendUrl}</a>
                    </p>
                    <p style="color:#cbd5e1;font-size:11px;margin:0">
                      Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
