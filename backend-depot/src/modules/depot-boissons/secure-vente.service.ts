import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import {
  AuditSeverite,
  ModePaiement,
  Prisma,
  StatutVente,
  TypeMouvement,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AUDIT_ACTIONS } from '../../audit/audit-actions.constants';
import { AuditActor } from '../../audit/audit-actor.util';
import { DepotBoissonsService } from './depot-boissons.service';

/**
 * Financially strict POS implementation for the beverage-depot métier.
 *
 * The legacy DepotBoissonsService remains available for the other depot
 * features, while this class becomes the implementation behind POST /ventes.
 * The whole sale is atomic: sale + lines + cash + stock + debt + consignment.
 */
@Injectable()
export class SecureDepotBoissonsVenteService extends DepotBoissonsService {
  private readonly db: PrismaService;
  private readonly audit: AuditService;

  constructor(prisma: PrismaService, auditService: AuditService) {
    super(prisma, auditService);
    this.db = prisma;
    this.audit = auditService;
  }

  override async createVente(
    tenantId: string,
    data: any,
    actor: AuditActor,
  ) {
    const depotId = this.requireDepotId(data?.depotId);
    const id = typeof data?.id === 'string' && data.id.trim() ? data.id.trim() : undefined;
    const clientRef = typeof data?.reference === 'string' ? data.reference.trim() : '';
    const mode: ModePaiement = data?.modePaiement || ModePaiement.CASH;
    const lignes = Array.isArray(data?.articles) ? data.articles : [];

    if (lignes.length === 0) {
      throw new BadRequestException('Une vente doit contenir au moins une ligne.');
    }

    if (id) {
      const existing = await this.db.vente.findFirst({
        where: { id, tenantId, depotId },
        include: { lignes: { include: { article: true } }, client: true },
      });
      if (existing) return existing;
    }

    if (!Object.values(ModePaiement).includes(mode)) {
      throw new BadRequestException('Mode de paiement invalide.');
    }

    let totalVente = 0;
    const lignesData: Prisma.LigneVenteCreateWithoutVenteInput[] = [];
    const stockDeductions = new Map<string, number>();

    for (const ligne of lignes) {
      const articleId = String(ligne?.articleId || '').trim();
      const quantite = Number(ligne?.quantite);
      const prixUnitaire = Number(ligne?.prixUnitaire);
      const remise = Number(ligne?.remise ?? 0);

      if (!articleId) throw new BadRequestException('articleId est requis pour chaque ligne.');
      if (!Number.isInteger(quantite) || quantite <= 0) {
        throw new BadRequestException('La quantité de chaque ligne doit être un entier supérieur à 0.');
      }
      if (!Number.isFinite(remise) || remise < 0) {
        throw new BadRequestException('La remise doit être positive ou nulle.');
      }

      const article = await this.db.article.findFirst({
        where: { id: articleId, tenantId },
        select: { id: true, designation: true, prixVente: true },
      });
      if (!article) throw new BadRequestException(`Article introuvable: ${articleId}.`);

      let prix = Number(article.prixVente);
      let deductions: Array<{ articleId: string; quantite: number }> = [
        { articleId: article.id, quantite },
      ];

      if (ligne?.conditionnementId) {
        const conditionnement = await this.db.conditionnement.findFirst({
          where: {
            id: String(ligne.conditionnementId),
            tenantId,
            articleId: article.id,
          },
        });
        if (!conditionnement) {
          throw new BadRequestException('Conditionnement introuvable pour cet article.');
        }
        if (!Number.isInteger(conditionnement.quantiteUnitaire) || conditionnement.quantiteUnitaire <= 0) {
          throw new BadRequestException('Conditionnement invalide.');
        }
        prix = ligne.prixUnitaire == null ? Number(conditionnement.prixVente) : prixUnitaire;
        deductions = [{
          articleId: article.id,
          quantite: quantite * conditionnement.quantiteUnitaire,
        }];
      } else if (ligne?.casierMixte) {
        const composition = Array.isArray(ligne.composition) ? ligne.composition : null;
        if (!composition?.length) {
          throw new BadRequestException('La composition du casier mixte est obligatoire.');
        }
        prix = ligne.prixUnitaire == null ? Number(article.prixVente) : prixUnitaire;
        deductions = composition.map((item: any) => {
          const componentId = String(item?.articleId || '').trim();
          const componentQty = Number(item?.quantite);
          if (!componentId || !Number.isInteger(componentQty) || componentQty <= 0) {
            throw new BadRequestException('Composition de casier mixte invalide.');
          }
          return { articleId: componentId, quantite: componentQty * quantite };
        });
      } else if (ligne?.prixUnitaire != null && !Number.isFinite(prixUnitaire)) {
        throw new BadRequestException('Prix de vente invalide.');
      }

      if (!Number.isFinite(prix) || prix < 0) {
        throw new BadRequestException(`Prix invalide pour l'article ${article.designation}.`);
      }
      const totalLigne = Number((prix * quantite - remise).toFixed(2));
      if (!Number.isFinite(totalLigne) || totalLigne < 0) {
        throw new BadRequestException('Le total d’une ligne ne peut pas être négatif.');
      }

      for (const deduction of deductions) {
        const component = await this.db.article.findFirst({
          where: { id: deduction.articleId, tenantId },
          select: { id: true },
        });
        if (!component) {
          throw new BadRequestException(`Article de stock introuvable: ${deduction.articleId}.`);
        }
        stockDeductions.set(
          deduction.articleId,
          (stockDeductions.get(deduction.articleId) || 0) + deduction.quantite,
        );
      }

      totalVente += totalLigne;
      lignesData.push({
        article: { connect: { id: article.id } },
        quantite,
        prix,
        remise,
        total: totalLigne,
        casierMixte: Boolean(ligne?.casierMixte),
        composition: ligne?.composition ?? undefined,
        conditionnement: ligne?.conditionnementId
          ? { connect: { id: String(ligne.conditionnementId) } }
          : undefined,
      });
    }

    const montantTotal = Number(totalVente.toFixed(2));
    if (!Number.isFinite(montantTotal) || montantTotal <= 0) {
      throw new BadRequestException('Le total de la vente doit être supérieur à 0.');
    }

    const cash = this.paymentAmount(data?.montantCash, mode === ModePaiement.CASH ? montantTotal : 0);
    const om = this.paymentAmount(data?.montantOM, mode === ModePaiement.ORANGE_MONEY ? montantTotal : 0);
    const momo = this.paymentAmount(data?.montantMoMo, mode === ModePaiement.MTN_MOMO ? montantTotal : 0);
    const credit = this.paymentAmount(data?.montantCredit, mode === ModePaiement.CREDIT ? montantTotal : 0);

    if (mode !== ModePaiement.MIXTE) {
      const expected = {
        [ModePaiement.CASH]: cash,
        [ModePaiement.ORANGE_MONEY]: om,
        [ModePaiement.MTN_MOMO]: momo,
        [ModePaiement.CREDIT]: credit,
      } as Record<string, number>;
      for (const [key, value] of Object.entries({ cash, om, momo, credit })) {
        const allowed = key === this.paymentKey(mode);
        if (!allowed && value > 0.01) {
          throw new BadRequestException(`Paiement incohérent pour le mode ${mode}.`);
        }
      }
      if (!(expected[mode] > 0)) {
        throw new BadRequestException('Le montant du paiement est obligatoire.');
      }
    }

    const totalPaiement = Number((cash + om + momo + credit).toFixed(2));
    if (Math.abs(totalPaiement - montantTotal) > 0.01) {
      throw new BadRequestException(
        `Paiement incohérent : ${totalPaiement} FCFA pour une vente de ${montantTotal} FCFA.`,
      );
    }

    if (credit > 0 && !data?.clientId) {
      throw new BadRequestException('Un client est obligatoire dès qu’une part de la vente est à crédit.');
    }

    const reference = clientRef || `FAC-${new Date().getFullYear()}-${randomUUID()}`;

    try {
      const vente = await this.db.$transaction(async (tx) => {
        let client: { id: string; nom: string; soldeCredit: number } | null = null;
        if (data?.clientId) {
          client = await tx.client.findFirst({
            where: {
              id: String(data.clientId),
              tenantId,
              OR: [{ depotId }, { depotId: null }],
            },
            select: { id: true, nom: true, soldeCredit: true },
          });
          if (!client) throw new BadRequestException('Client introuvable pour ce dépôt.');
        }

        if (data?.tourneeId) {
          const tournee = await tx.tournee.findFirst({
            where: { id: String(data.tourneeId), tenantId, depotId },
            select: { id: true },
          });
          if (!tournee) throw new BadRequestException('Tournée introuvable pour ce dépôt.');
        }

        let sessionId: string | null = null;
        if (cash > 0) {
          const session = await tx.sessionCaisse.findFirst({
            where: { tenantId, depotId, estOuverte: true },
            select: { id: true },
          });
          if (!session) {
            throw new BadRequestException(
              'Impossible d’encaisser en espèces : aucune session de caisse ouverte pour ce dépôt.',
            );
          }
          sessionId = session.id;
        }

        const created = await tx.vente.create({
          data: {
            id,
            reference,
            total: montantTotal,
            statut: StatutVente.PAYE,
            modePaiement: mode,
            montantCash: cash,
            montantOM: om,
            montantMoMo: momo,
            montantCredit: credit,
            tenantId,
            depotId,
            clientId: client?.id ?? null,
            createurId: actor.userId,
            tourneeId: data?.tourneeId ? String(data.tourneeId) : null,
            lignes: { create: lignesData },
          },
          include: { lignes: { include: { article: true } }, client: true },
        });

        if (sessionId && cash > 0) {
          await tx.mouvementCaisse.create({
            data: {
              type: 'ENCAISSEMENT_VENTE',
              montant: cash,
              motif: `Encaissement vente ${reference}`,
              reference: created.id,
              sessionId,
            },
          });
        }

        for (const [articleId, quantity] of stockDeductions.entries()) {
          const updated = await tx.stock.updateMany({
            where: { articleId, depotId, quantite: { gte: quantity } },
            data: { quantite: { decrement: quantity } },
          });
          if (updated.count !== 1) {
            throw new ConflictException(
              `Stock insuffisant ou modifié entre-temps pour l’article ${articleId}. La vente a été annulée.`,
            );
          }
          await tx.mouvementStock.create({
            data: {
              type: TypeMouvement.SORTIE_VENTE,
              quantite: quantity,
              articleId,
              depotId,
              tenantId,
              motif: `Vente POS ${reference}`,
            },
          });
        }

        if (credit > 0 && client) {
          await tx.detteClient.create({
            data: {
              montant: credit,
              montantPaye: 0,
              statut: 'EN_COURS',
              reference,
              clientId: client.id,
              tenantId,
              depotId,
            },
          });
          await tx.client.update({
            where: { id: client.id },
            data: { soldeCredit: { increment: credit } },
          });
        }

        if (Array.isArray(data?.retoursConsigne) && data.retoursConsigne.length > 0) {
          if (!client) {
            throw new BadRequestException('Un client est obligatoire pour enregistrer un retour de consignes.');
          }

          for (const retour of data.retoursConsigne) {
            const typeConsigneId = String(retour?.typeConsigneId || '').trim();
            const quantite = Number(retour?.quantite);
            if (!typeConsigneId || !Number.isInteger(quantite) || quantite <= 0) {
              throw new BadRequestException('Retour de consigne invalide.');
            }

            const typeConsigne = await tx.typeConsigneConfig.findFirst({
              where: { id: typeConsigneId, tenantId },
              select: { id: true },
            });
            if (!typeConsigne) throw new BadRequestException('Type de consigne introuvable.');

            const portfolio = await tx.portefeuilleConsigne.findUnique({
              where: {
                clientId_typeConsigneId: {
                  clientId: client.id,
                  typeConsigneId,
                },
              },
            });
            if (!portfolio || portfolio.quantite < quantite) {
              throw new BadRequestException('Quantité de consignes retournées supérieure au portefeuille client.');
            }

            await tx.portefeuilleConsigne.update({
              where: {
                clientId_typeConsigneId: {
                  clientId: client.id,
                  typeConsigneId,
                },
              },
              data: { quantite: { decrement: quantite } },
            });

            await tx.mouvementConsigne.create({
              data: {
                quantite,
                motif: `Retour vide sur vente ${reference}`,
                estSortie: false,
                tenantId,
                depotId,
                venteId: created.id,
                typeConsigne: { connect: { id: typeConsigneId } },
              },
            });
          }
        }

        return created;
      });

      await this.audit.logEvent({
        tenantId,
        depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.VENTE_CREEE,
        severite: AuditSeverite.INFO,
        targetType: 'Vente',
        targetId: vente.id,
        reference: vente.reference,
        description: `Vente ${vente.reference} créée — ${vente.total} FCFA`,
        valeurApres: {
          total: vente.total,
          modePaiement: vente.modePaiement,
          montantCash: vente.montantCash,
          montantOM: vente.montantOM,
          montantMoMo: vente.montantMoMo,
          montantCredit: vente.montantCredit,
        },
        montant: vente.total,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });

      return vente;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && id) {
        const existing = await this.db.vente.findFirst({
          where: { id, tenantId, depotId },
          include: { lignes: { include: { article: true } }, client: true },
        });
        if (existing) return existing;
        throw new ConflictException('Identifiant de vente déjà utilisé.');
      }
      throw error;
    }
  }

  private requireDepotId(depotId: unknown): string {
    if (typeof depotId !== 'string' || !depotId.trim()) {
      throw new BadRequestException('Dépôt actif requis pour enregistrer la vente.');
    }
    return depotId.trim();
  }

  private paymentAmount(value: unknown, fallback: number): number {
    if (value === undefined || value === null || value === '') return fallback;
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new BadRequestException('Les montants de paiement doivent être positifs ou nuls.');
    }
    return Number(amount.toFixed(2));
  }

  private paymentKey(mode: ModePaiement): string {
    switch (mode) {
      case ModePaiement.CASH:
        return 'cash';
      case ModePaiement.ORANGE_MONEY:
        return 'om';
      case ModePaiement.MTN_MOMO:
        return 'momo';
      case ModePaiement.CREDIT:
        return 'credit';
      case ModePaiement.MIXTE:
        return 'mixed';
      default:
        return '';
    }
  }
}
