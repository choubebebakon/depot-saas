import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../common/email/email.service';
import { Payment, PaymentMethod, BillingCycle } from '@prisma/client';

/**
 * Interface pour les donnees de facture.
 */
interface InvoiceData {
  invoiceNumber: string;
  tenantName: string;
  tenantAddress?: string;
  tenantPhone?: string;
  tenantEmail?: string;
  planName: string;
  billingCycle: BillingCycle;
  amountHT: number;
  tvaRate: number;
  tvaAmount: number;
  amountTTC: number;
  currency: string;
  paymentMethod: PaymentMethod;
  transactionId: string | null;
  paymentDate: Date;
  periodStart: Date;
  periodEnd: Date;
  issueDate: Date;
}

/**
 * Service de facturation PDF.
 * Genere des factures conformes a la TVA camerounaise (19.25%).
 */
@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);
  private readonly TVA_RATE = 0.1925;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) { }

  /**
   * Genere une facture PDF apres paiement reussi.
   * Appelle automatiquement par le webhook de confirmation de paiement.
   *
   * @param paymentId - ID du paiement confirme
   * @returns Buffer PDF de la facture
   */
  async generateInvoice(paymentId: string): Promise<Buffer> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        tenant: true,
      },
    });

    if (!payment) {
      throw new NotFoundException({
        error: 'PAYMENT_NOT_FOUND',
        message: 'Paiement introuvable.',
      });
    }

    const invoiceData: InvoiceData = {
      invoiceNumber: this.generateInvoiceNumber(payment),
      tenantName: (payment.tenant?.name as string) || 'Client',
      tenantAddress: undefined, // TODO: Ajouter adresse au modele Tenant
      tenantPhone: undefined,   // TODO: Ajouter telephone au modele Tenant
      tenantEmail: undefined,   // TODO: Recuperer email admin
      planName: (payment.planPurchased as string) || 'Standard',
      billingCycle: payment.billingCycle as BillingCycle,
      amountHT: payment.amount,
      tvaRate: this.TVA_RATE,
      tvaAmount: payment.tvaAmount,
      amountTTC: payment.totalAmount,
      currency: payment.currency || 'XAF',
      paymentMethod: payment.method,
      transactionId: (payment.operatorTxId || payment.stripePaymentIntentId) as string | null,
      paymentDate: payment.updatedAt,
      periodStart: payment.periodStart as Date,
      periodEnd: payment.periodEnd as Date,
      issueDate: new Date(),
    };

    const pdfBuffer = await this.createPDF(invoiceData);

    const tenantEmail = payment.tenant?.emailPatron || (payment.tenant as any)?.emailPatron;
    if (tenantEmail) {
      this.emailService.sendInvoiceEmail(
        tenantEmail,
        invoiceData.tenantName,
        invoiceData.invoiceNumber,
        invoiceData.amountTTC,
        pdfBuffer,
      ).catch((err) => this.logger.error(`Erreur envoi facture par email: ${err.message}`));
    }

    this.logger.log(
      `Facture generee | tenant: ${payment.tenantId} | paiement: ${payment.id} | total: ${payment.totalAmount} XAF`,
    );

    return pdfBuffer;
  }

  /**
   * Genere le numero de facture unique.
   * Format: FAC-YYYYMMDD-XXXX (XXXX = ID court du paiement)
   */
  private generateInvoiceNumber(payment: Payment): string {
    const date = format(payment.createdAt, 'yyyyMMdd');
    const shortId = payment.id.slice(-4).toUpperCase();
    return `FAC-${date}-${shortId}`;
  }

  /**
   * Cree le PDF de la facture.
   *
   * @param data - Donnees de la facture
   * @returns Buffer PDF
   */
  private async createPDF(data: InvoiceData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4

    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 50;

    // === EN-TETE ===
    page.drawText('GeStock', {
      x: 50,
      y,
      size: 24,
      font: fontBold,
      color: rgb(0.37, 0.4, 0.94),
    });

    y -= 30;

    page.drawText('Gestion de stock pour le Cameroun', {
      x: 50,
      y,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    y -= 20;

    page.drawText('contact@gestock.cm | Douala, Cameroun', {
      x: 50,
      y,
      size: 9,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Numero de facture et date (a droite)
    const rightX = width - 200;
    y = height - 50;

    page.drawText('FACTURE', {
      x: rightX,
      y,
      size: 20,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    y -= 25;

    page.drawText(data.invoiceNumber, {
      x: rightX,
      y,
      size: 11,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    y -= 20;

    page.drawText(
      `Date: ${format(data.issueDate, 'dd/MM/yyyy', { locale: fr })}`,
      { x: rightX, y, size: 10, font, color: rgb(0.4, 0.4, 0.4) },
    );

    // === CLIENT ===
    y = height - 180;

    page.drawText('FACTURER A:', {
      x: 50,
      y,
      size: 10,
      font: fontBold,
      color: rgb(0.4, 0.4, 0.4),
    });

    y -= 20;

    page.drawText(data.tenantName, {
      x: 50,
      y,
      size: 14,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    if (data.tenantAddress) {
      y -= 18;
      page.drawText(data.tenantAddress, {
        x: 50, y, size: 10, font, color: rgb(0.3, 0.3, 0.3),
      });
    }

    if (data.tenantEmail) {
      y -= 15;
      page.drawText(data.tenantEmail, {
        x: 50, y, size: 10, font, color: rgb(0.3, 0.3, 0.3),
      });
    }

    // === DETAILS DE LA FACTURE ===
    y = height - 300;

    page.drawRectangle({
      x: 50,
      y: y - 25,
      width: width - 100,
      height: 25,
      color: rgb(0.95, 0.95, 0.95),
    });

    page.drawText('Description', {
      x: 60, y: y - 17, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText('Periode', {
      x: 250, y: y - 17, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText('Montant HT', {
      x: 400, y: y - 17, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2),
    });

    y -= 40;

    const planLabel = `${data.planName} - Abonnement ${data.billingCycle === 'MONTHLY' ? 'Mensuel' : 'Annuel'}`;
    page.drawText(planLabel, {
      x: 60, y, size: 10, font, color: rgb(0, 0, 0),
    });

    const periodLabel = `${format(data.periodStart, 'dd/MM/yy')} - ${format(data.periodEnd, 'dd/MM/yy')}`;
    page.drawText(periodLabel, {
      x: 250, y, size: 9, font, color: rgb(0.4, 0.4, 0.4),
    });

    page.drawText(`${this.formatPrice(data.amountHT)} ${data.currency}`, {
      x: 400, y, size: 10, font, color: rgb(0, 0, 0),
    });

    // === TOTAUX ===
    y -= 60;

    page.drawLine({
      start: { x: 300, y },
      end: { x: width - 50, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    y -= 25;

    page.drawText('Montant HT:', {
      x: 320, y, size: 10, font, color: rgb(0.4, 0.4, 0.4),
    });
    page.drawText(`${this.formatPrice(data.amountHT)} ${data.currency}`, {
      x: 450, y, size: 10, font, color: rgb(0, 0, 0),
    });

    y -= 20;

    page.drawText(`TVA (${(data.tvaRate * 100).toFixed(2)}%):`, {
      x: 320, y, size: 10, font, color: rgb(0.4, 0.4, 0.4),
    });
    page.drawText(`${this.formatPrice(data.tvaAmount)} ${data.currency}`, {
      x: 450, y, size: 10, font, color: rgb(0, 0, 0),
    });

    y -= 25;

    page.drawLine({
      start: { x: 300, y },
      end: { x: width - 50, y },
      thickness: 2,
      color: rgb(0.37, 0.4, 0.94),
    });

    y -= 25;

    page.drawText('TOTAL TTC:', {
      x: 320, y, size: 12, font: fontBold, color: rgb(0.37, 0.4, 0.94),
    });
    page.drawText(`${this.formatPrice(data.amountTTC)} ${data.currency}`, {
      x: 450, y, size: 12, font: fontBold, color: rgb(0.37, 0.4, 0.94),
    });

    // === INFORMATIONS DE PAIEMENT ===
    y -= 60;

    page.drawText('PAIEMENT', {
      x: 50, y, size: 12, font: fontBold, color: rgb(0.2, 0.2, 0.2),
    });

    y -= 25;

    page.drawText(`Methode: ${this.getPaymentMethodLabel(data.paymentMethod)}`, {
      x: 50, y, size: 10, font, color: rgb(0.3, 0.3, 0.3),
    });

    y -= 18;

    page.drawText(
      `Date: ${format(data.paymentDate, 'dd/MM/yyyy HH:mm', { locale: fr })}`,
      { x: 50, y, size: 10, font, color: rgb(0.3, 0.3, 0.3) },
    );

    if (data.transactionId) {
      y -= 18;
      page.drawText(`Transaction ID: ${data.transactionId}`, {
        x: 50, y, size: 9, font, color: rgb(0.5, 0.5, 0.5),
      });
    }

    // === FOOTER ===
    y = 80;

    page.drawText(
      'GeStock - SARL au Cameroun - NIU: XXXXXXX - BP: XXXXX Douala',
      { x: 50, y, size: 8, font, color: rgb(0.5, 0.5, 0.5) },
    );

    y -= 15;

    page.drawText(
      'Cette facture est generee automatiquement et est valide sans signature.',
      { x: 50, y, size: 8, font, color: rgb(0.5, 0.5, 0.5) },
    );

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Formate un montant en prix avec separateurs de milliers.
   */
  private formatPrice(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(amount);
  }

  /**
   * Retourne le libelle de la methode de paiement.
   */
  private getPaymentMethodLabel(method: PaymentMethod): string {
    const labels: Record<PaymentMethod, string> = {
      MTN_MOMO: 'MTN Mobile Money',
      VISA_CARD: 'Carte Visa',
      MASTERCARD: 'MasterCard',
      ORANGE_MONEY: 'Orange Money',
      CASH: 'Espèces',
      STRIPE: 'Stripe (International)',
    };
    return labels[method] || method;
  }

  /**
   * Recupere une facture existante par ID de paiement.
   *
   * @param paymentId - ID du paiement
   * @returns Buffer PDF ou null si non generee
   */
  async getInvoiceByPaymentId(paymentId: string): Promise<Buffer | null> {
    // TODO: Implementer le stockage des factures (S3, filesystem)
    try {
      return await this.generateInvoice(paymentId);
    } catch {
      return null;
    }
  }
}
