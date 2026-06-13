import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LivraisonBTPStatut } from '@prisma/client';

@Injectable()
export class LivraisonsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string, tenantId: string, depotId?: string) {
    const livraison = await this.prisma.livraisonBTP.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        lignes: {
          include: {
            article: true,
          },
        },
        chantier: true,
        vehicule: true,
      },
    });

    if (!livraison) {
      throw new NotFoundException('Livraison non trouvée');
    }

    return livraison;
  }

  async confirmer(id: string, tenantId: string, depotId: string, user: any) {
    const livraison = await this.prisma.livraisonBTP.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!livraison) {
      throw new NotFoundException('Livraison non trouvée');
    }

    const updatedLivraison = await this.prisma.livraisonBTP.update({
      where: { id },
      data: {
        statut: LivraisonBTPStatut.LIVREE,
        dateLivraison: new Date(),
      },
    });

    // Loguer l'action dans le journal d'audit
    await this.prisma.journalAudit.create({
      data: {
        tenantId,
        depotId,
        actorUserId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'CONFIRMATION_LIVRAISON',
        targetType: 'LivraisonBTP',
        targetId: id,
        description: `Livraison ${id} confirmée par ${user.email}`,
        metadataText: JSON.stringify({
          livraisonId: id,
          statut: LivraisonBTPStatut.LIVREE,
        }),
      },
    });

    return updatedLivraison;
  }
}
