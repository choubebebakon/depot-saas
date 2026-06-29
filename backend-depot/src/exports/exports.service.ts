import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { unparse } from 'papaparse';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Donnees d'un dépôt pour export.
 */
interface DepotExportData {
  id: string;
  name: string;
  isArchived: boolean;
  archivedAt: Date | null;
  articleCount: number;
  stockTotalValue: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Rapport de transition pour downgrade.
 */
interface DowngradeReport {
  tenantId: string;
  tenantName: string;
  currentPlan: string;
  newPlan: string;
  currentMaxDepots: number;
  newMaxDepots: number;
  depotsToArchive: DepotExportData[];
  depotsToKeep: DepotExportData[];
  exportDate: Date;
}

/**
 * Service d'export de données.
 * Genere CSV et PDF avant tout downgrade de plan.
 */
@Injectable()
export class ExportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Genere un rapport de downgrade pour un tenant.
   * Detecte les depots excédentaires et propose ceux a conserver.
   *
   * @param tenantId - ID du tenant
   * @param newPlan - Nouveau plan (souvent inferieur)
   * @returns Rapport de transition complet
   */
  async generateDowngradeReport(
    tenantId: string,
    newPlan: string,
  ): Promise<DowngradeReport> {
    const tenant = (await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        depots: {
          where: { isArchived: false },
          orderBy: { updatedAt: 'desc' },
          // Relation _count non disponible dans le schema actuel
          include: {},
        },
      },
    })) as {
      id: string;
      name: string;
      plan: string;
      status: string;
      maxDepots: number;
      subscriptionEnd: Date;
      lastPaymentId: string | null;
      depots: Array<{
        id: string;
        name: string;
        isArchived: boolean;
        archivedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        _count: { stocks: number };
      }>;
    } | null;

    if (!tenant) {
      throw new NotFoundException({
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant introuvable.',
      });
    }

    // Plan max depots mapping
    const planMaxDepots: Record<string, number> = {
      TRIAL: 1,
      SOLO: 1,
      PME: 5,
      ENTERPRISE: 20,
      UNLIMITED: 999999,
    };

    const newMaxDepots = planMaxDepots[newPlan] || 1;
    const currentMaxDepots = planMaxDepots[tenant.plan] || tenant.maxDepots;

    // Mapper les depots avec leurs statistiques
    const allDepots: DepotExportData[] = tenant.depots.map((depot) => ({
      id: depot.id,
      name: depot.name,
      isArchived: depot.isArchived,
      archivedAt: depot.archivedAt,
      articleCount: (depot as any)._count?.stocks || 0,
      stockTotalValue: 0, // TODO: Calculer la valeur totale du stock
      createdAt: depot.createdAt,
      updatedAt: depot.updatedAt,
    }));

    // Trier par activite (plus recent en premier) pour suggerer ceux a garder
    const sortedDepots = allDepots.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );

    const depotsToKeep = sortedDepots.slice(0, newMaxDepots);
    const depotsToArchive = sortedDepots.slice(newMaxDepots);

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      currentPlan: tenant.plan,
      newPlan,
      currentMaxDepots,
      newMaxDepots,
      depotsToArchive,
      depotsToKeep,
      exportDate: new Date(),
    };
  }

  /**
   * Genere un fichier CSV des depots a archiver.
   *
   * @param report - Rapport de downgrade
   * @returns Buffer CSV
   */
  generateDepotsCSV(report: DowngradeReport): Buffer {
    const data = report.depotsToArchive.map((depot) => ({
      'ID Depot': depot.id,
      Nom: depot.name,
      'Date Creation': format(depot.createdAt, 'dd/MM/yyyy HH:mm', {
        locale: fr,
      }),
      'Date MAJ': format(depot.updatedAt, 'dd/MM/yyyy HH:mm', { locale: fr }),
      'Nombre Articles': depot.articleCount,
      'Valeur Stock': depot.stockTotalValue,
    }));

    const csv = unparse(data, {
      header: true,
      delimiter: ';',
      newline: '\n',
    });

    return Buffer.from('\ufeff' + csv, 'utf-8'); // BOM pour Excel
  }

  /**
   * Genere un PDF de confirmation de downgrade.
   *
   * @param report - Rapport de downgrade
   * @returns Buffer PDF
   */
  async generateDowngradePDF(report: DowngradeReport): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4

    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 50;

    // Titre
    page.drawText('GeStock - Confirmation de Downgrade', {
      x: 50,
      y,
      size: 18,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    y -= 30;

    // Info entreprise
    page.drawText(`Entreprise: ${report.tenantName}`, {
      x: 50,
      y,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    y -= 20;

    page.drawText(
      `Date d'export: ${format(report.exportDate, 'dd/MM/yyyy HH:mm', { locale: fr })}`,
      {
        x: 50,
        y,
        size: 10,
        font,
        color: rgb(0.3, 0.3, 0.3),
      },
    );

    y -= 40;

    // Changement de plan
    page.drawText('Changement de plan:', {
      x: 50,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    y -= 20;

    page.drawText(
      `${report.currentPlan} (${report.currentMaxDepots} depots) -> ${report.newPlan} (${report.newMaxDepots} depots)`,
      {
        x: 50,
        y,
        size: 11,
        font,
        color: rgb(0.2, 0.2, 0.2),
      },
    );

    y -= 40;

    // Depots a conserver
    page.drawText(`Depots conserves (${report.depotsToKeep.length}):`, {
      x: 50,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0, 0.5, 0),
    });

    y -= 20;

    report.depotsToKeep.forEach((depot) => {
      page.drawText(`- ${depot.name} (${depot.articleCount} articles)`, {
        x: 70,
        y,
        size: 10,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 15;
    });

    y -= 20;

    // Depots a archiver
    if (report.depotsToArchive.length > 0) {
      page.drawText(`Depots archives (${report.depotsToArchive.length}):`, {
        x: 50,
        y,
        size: 12,
        font: fontBold,
        color: rgb(0.8, 0, 0),
      });

      y -= 20;

      report.depotsToArchive.forEach((depot) => {
        page.drawText(`- ${depot.name} (${depot.articleCount} articles)`, {
          x: 70,
          y,
          size: 10,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
        y -= 15;
      });

      y -= 30;

      // Note d'archivage
      page.drawText(
        'Note: Les depots archives restent accessibles en lecture seule.',
        {
          x: 50,
          y,
          size: 9,
          font,
          color: rgb(0.5, 0.5, 0.5),
        },
      );

      y -= 15;

      page.drawText(
        'Ils peuvent etre restaures si vous repassez a un plan superieur.',
        {
          x: 50,
          y,
          size: 9,
          font,
          color: rgb(0.5, 0.5, 0.5),
        },
      );
    }

    // Footer
    y = 50;
    page.drawText('GeStock - Gestion de stock pour le Cameroun', {
      x: 50,
      y,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Genere un email recapitulatif avec liens de telechargement.
   *
   * @param report - Rapport de downgrade
   * @param downloadLinks - Liens de telechargement CSV et PDF
   * @returns Corps de l'email en HTML
   */
  generateDowngradeEmail(
    report: DowngradeReport,
    downloadLinks: { csv: string; pdf: string },
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #6366f1; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; max-width: 600px; margin: 0 auto; }
    .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    .depot-list { background: #f3f4f6; padding: 15px; margin: 10px 0; border-radius: 5px; }
    .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; 
              text-decoration: none; border-radius: 5px; margin: 10px 5px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>GeStock - Confirmation de Downgrade</h1>
  </div>
  
  <div class="content">
    <p>Bonjour,</p>
    
    <p>Votre changement de plan a ete effectue avec succes.</p>
    
    <div class="alert">
      <strong>Changement :</strong> ${report.currentPlan} -> ${report.newPlan}<br>
      <strong>Depots autorises :</strong> ${report.newMaxDepots} (au lieu de ${report.currentMaxDepots})
    </div>
    
    <h3>Depots conserves (${report.depotsToKeep.length}) :</h3>
    <div class="depot-list">
      ${report.depotsToKeep.map((d) => `- ${d.name} (${d.articleCount} articles)`).join('<br>')}
    </div>
    
    ${
      report.depotsToArchive.length > 0
        ? `
    <h3>Depots archives (${report.depotsToArchive.length}) :</h3>
    <div class="depot-list">
      ${report.depotsToArchive.map((d) => `- ${d.name} (${d.articleCount} articles)`).join('<br>')}
    </div>
    
    <p><em>Ces depots restent accessibles en lecture seule et peuvent etre restaures si vous repassez a un plan superieur.</em></p>
    `
        : ''
    }
    
    <h3>Telechargements :</h3>
    <p>
      <a href="${downloadLinks.csv}" class="button">📊 Export CSV</a>
      <a href="${downloadLinks.pdf}" class="button">📄 Rapport PDF</a>
    </p>
    
    <p>Cordialement,<br>L'equipe GeStock</p>
  </div>
  
  <div class="footer">
    <p>GeStock - Gestion de stock pour le Cameroun</p>
    <p>Cet email est genere automatiquement, merci de ne pas y repondre.</p>
  </div>
</body>
</html>
    `;
  }
}
