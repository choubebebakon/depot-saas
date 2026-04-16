import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ImpressionService {
  constructor(private prisma: PrismaService) {}

  async genererTicketVente(venteId: string, tenantId: string) {
    // 1. Récupération de la vente avec les relations complètes incluses
    const vente = await this.prisma.vente.findUnique({
      where: { id: venteId },
      include: {
        tenant: true,  // Pour l'en-tête (Nom, tel)
        site: true,    // Pour l'adresse du site
        lignes: {
          include: {
            article: true, // Pour la désignation de chaque article
          },
        },
      },
    });

    // Filtre Multi-Tenant de sécurité
    if (!vente || vente.tenantId !== tenantId) {
      throw new NotFoundException('Vente introuvable ou vous n\'y avez pas accès.');
    }

    // 2. Fonctions utilitaires de formatage pour l'imprimante thermique (Largeur 32 caractères typique 58mm)
    const LINE_LENGTH = 32;

    const centerText = (text: string) => {
      text = text.trim();
      if (text.length >= LINE_LENGTH) return text.substring(0, LINE_LENGTH);
      const leftLength = Math.floor((LINE_LENGTH - text.length) / 2);
      return ' '.repeat(leftLength) + text;
    };

    const alignRight = (leftText: string, rightText: string) => {
      const spaceCount = LINE_LENGTH - leftText.length - rightText.length;
      if (spaceCount <= 0) return leftText + ' ' + rightText;
      return leftText + ' '.repeat(spaceCount) + rightText;
    };

    const separator = '-'.repeat(LINE_LENGTH);

    // 3. Construction du tableau des lignes du ticket
    const ticketLines: string[] = [];

    // --- EN-TÊTE ---
    ticketLines.push(centerText(vente.tenant.nomEntreprise.toUpperCase()));
    if (vente.site.adresse) {
      ticketLines.push(centerText(vente.site.adresse));
    }
    if (vente.tenant.telephone) {
      ticketLines.push(centerText(`Tel: ${vente.tenant.telephone}`));
    }
    ticketLines.push(centerText(`Ref: ${vente.reference}`));
    ticketLines.push('');

    // --- EN-TÊTE TABLEAU DES ARTICLES ---
    ticketLines.push(separator);
    // On alloue : 3 ch (Qté) | 12 ch (Nom) | 6 ch (PU) | 7 ch (Total) = 28 + espaces = 32
    ticketLines.push('Qté ' + 'Article     ' + 'P.U   ' + 'Total  ');
    ticketLines.push(separator);

    // --- CORPS (LIGNES DE VENTE) ---
    for (const ligne of vente.lignes) {
      // Formatage des colonnes : on s'assure de respecter les largeurs
      const qte = String(ligne.quantite).padEnd(3, ' ');
      const designation = (ligne.article.designation || '').substring(0, 11).padEnd(11, ' ');
      const pu = String(ligne.prixUnitaire).padStart(5, ' ') + ' ';
      const total = String(ligne.total).padStart(6, ' ');

      ticketLines.push(`${qte} ${designation} ${pu} ${total}`);
    }
    ticketLines.push(separator);

    // --- PIED DE PAGE ---
    ticketLines.push(alignRight('TOTAL NET:', String(vente.total) + ' FCFA'));
    ticketLines.push(alignRight('Statut:', vente.statut));
    ticketLines.push('');

    // Date
    const dateAchat = vente.date.toLocaleDateString('fr-FR');
    const heureAchat = vente.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    ticketLines.push(`Date: ${dateAchat} a ${heureAchat}`);
    ticketLines.push('');
    
    // Remerciements
    ticketLines.push(centerText('Merci de votre confiance !'));
    // Lignes vides pour dégager le ticket de la lame de coupe
    ticketLines.push('');
    ticketLines.push('');

    // Rendu en texte brut, parfait pour l'ESC/POS
    const rawText = ticketLines.join('\n');

    return {
      success: true,
      venteId: vente.id,
      reference: vente.reference,
      rawText: rawText,       // Le texte prêt à être poussé sur le port Bluetooth / Printer
      lines: ticketLines      // Les lignes sous forme de tableau JSON, si utile pour le Front
    };
  }
}
