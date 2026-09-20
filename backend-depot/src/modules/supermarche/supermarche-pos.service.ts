import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditActor } from '../../audit/audit-actor.util';
import { DepotScopeService } from '../../common/depot-scope.service';
import { SupermarcheService } from './supermarche.service';

/**
 * Boundary de sécurité du POS Supermarché.
 *
 * Le frontend peut proposer un panier, mais le serveur reste propriétaire de :
 * - tenant/depot via le contexte authentifié ;
 * - prix catalogue ;
 * - total ;
 * - remises en montant ;
 * - existence et appartenance des articles ;
 * - existence du stock.
 *
 * La transaction et la vérification gte de SupermarcheService constituent la
 * seconde barrière contre les ventes concurrentes.
 */
@Injectable()
export class SupermarchePosService extends SupermarcheService {
  protected readonly db: PrismaService;

  constructor(
    prisma: PrismaService,
    auditService: AuditService,
    depotScope: DepotScopeService,
  ) {
    super(prisma, auditService, depotScope);
    this.db = prisma;
  }

  override async createVente(tenantId: string, data: any, actor: AuditActor) {
    if (!data?.depotId) {
      throw new BadRequestException('Aucun dépôt actif sélectionné.');
    }
    if (!Array.isArray(data.panier) || data.panier.length === 0) {
      throw new BadRequestException('Le panier ne peut pas être vide.');
    }

    const articleIds = [
      ...new Set<string>(
        data.panier.map((item: any) => String(item.articleId)),
      ),
    ];
    if (articleIds.some((id) => !id || !id.trim())) {
      throw new BadRequestException('Article invalide dans le panier.');
    }

    const articles = await this.db.article.findMany({
      where: {
        tenantId,
        id: { in: articleIds },
      },
      select: {
        id: true,
        designation: true,
        prixVente: true,
      },
    });

    if (articles.length !== articleIds.length) {
      throw new NotFoundException(
        'Un ou plusieurs articles ne sont pas autorisés pour ce tenant.',
      );
    }

    const articleMap = new Map(
      articles.map((article) => [article.id, article]),
    );
    const stockRows = await this.db.stock.findMany({
      where: {
        depotId: data.depotId,
        articleId: { in: articleIds },
        article: { tenantId },
      },
      select: { articleId: true, quantite: true },
    });
    const stockMap = new Map(
      stockRows.map((stock) => [stock.articleId, stock.quantite]),
    );

    const panier = data.panier.map((item: any) => {
      const article = articleMap.get(item.articleId);
      if (!article) {
        throw new NotFoundException(`Article ${item.articleId} introuvable.`);
      }

      const quantite = Number(item.quantite);
      if (!Number.isInteger(quantite) || quantite < 1) {
        throw new BadRequestException(
          `Quantité invalide pour ${article.designation}.`,
        );
      }

      const stockDisponible = stockMap.get(article.id) ?? 0;
      if (stockDisponible < quantite) {
        throw new BadRequestException(
          `Stock insuffisant pour ${article.designation}. Disponible : ${stockDisponible}.`,
        );
      }

      const prix = Number(article.prixVente);
      const remisePourcentage = Number(item.remise ?? 0);
      if (
        !Number.isFinite(remisePourcentage) ||
        remisePourcentage < 0 ||
        remisePourcentage > 100
      ) {
        throw new BadRequestException(
          `Remise invalide pour ${article.designation}.`,
        );
      }

      const sousTotal = quantite * prix;
      const remise = sousTotal * (remisePourcentage / 100);
      const totalLigne = sousTotal - remise;

      return {
        articleId: article.id,
        quantite,
        prix,
        // Le service historique attend un montant, pas un pourcentage.
        remise,
      };
    });

    const total = panier.reduce(
      (sum: number, ligne: any) =>
        sum + ligne.quantite * ligne.prix - ligne.remise,
      0,
    );

    if (!Number.isFinite(total) || total <= 0) {
      throw new BadRequestException('Total de vente invalide.');
    }

    if (data.clientId) {
      const client = await this.db.client.findFirst({
        where: { id: data.clientId, tenantId },
        select: { id: true },
      });
      if (!client) {
        throw new NotFoundException('Client introuvable ou non autorisé.');
      }
    }

    // Montant reçu / monnaie restituée : calcul vulgarisé côté serveur,
    // le client ne fournit que le montant présenté (CASH) ou rien (mobile).
    const estCash = data.modePaiement === 'CASH';
    const montantRecu = Number(data.montantRecu ?? 0);
    const montantRecuFinal = Number.isFinite(montantRecu) && estCash
      ? montantRecu
      : Number(data.total);
    if (estCash && Number.isFinite(montantRecu) && montantRecuFinal < Number(data.total)) {
      throw new BadRequestException(
        'Le montant reçu est inférieur au total de la vente.',
      );
    }
    const monnaieFinal = Math.max(
      0,
      Number((montantRecuFinal - Number(data.total)).toFixed(2)),
    );

    return super.createVente(
      tenantId,
      {
        ...data,
        total,
        panier,
        montantRecu: montantRecuFinal,
        monnaie: monnaieFinal,
      },
      actor,
    );
  }
}
