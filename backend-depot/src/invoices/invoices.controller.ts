import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  StreamableFile,
  Header,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { PrismaService } from '../prisma.service';

/**
 * Controleur de facturation.
 *
 * Routes disponibles:
 * - GET /api/v1/invoices/:paymentId : Telecharger la facture PDF d'un paiement
 */
@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Telecharge la facture PDF d'un paiement.
   * Verifie que le paiement appartient au tenant de l'utilisateur.
   *
   * @param user - Utilisateur authentifie
   * @param paymentId - ID du paiement
   * @param res - Reponse Express
   * @returns Fichier PDF telechargeable
   */
  @Get(':paymentId')
  @ApiOperation({ summary: 'Telecharger la facture PDF d\'un paiement' })
  @ApiResponse({ status: 200, description: 'Facture PDF telechargeable' })
  @ApiResponse({ status: 404, description: 'Paiement ou facture introuvable' })
  @ApiResponse({ status: 403, description: 'Acces interdit - paiement d\'un autre tenant' })
  @Header('Content-Type', 'application/pdf')
  async downloadInvoice(
    @CurrentUser() user: AuthenticatedUser,
    @Param('paymentId') paymentId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    // Verifier que le paiement existe et appartient au tenant de l'utilisateur
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        tenantId: user.tenantId,
        status: 'SUCCESS',
      },
      include: {
        tenant: {
          select: { name: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException({
        error: 'INVOICE_NOT_FOUND',
        message: 'Facture introuvable ou paiement non confirme.',
      });
    }

    // Generer ou recuperer la facture
    const pdfBuffer = await this.invoicesService.generateInvoice(paymentId);

    // Nom du fichier de telechargement
    const invoiceNumber = `FAC-${payment.createdAt.toISOString().slice(0, 10).replace(/-/g, '')}-${payment.id.slice(-4).toUpperCase()}`;
    const filename = `${(payment.tenant.name || 'Tenant').replace(/\s+/g, '_')}_${invoiceNumber}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(pdfBuffer);
  }
}
