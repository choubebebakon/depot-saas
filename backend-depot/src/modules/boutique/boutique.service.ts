import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { AuditSeverite } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { CATEGORIES_PAR_TYPE } from '../../../prisma/seeds/categoriesBoutique';
import { AuditService } from '../../audit/audit.service';
import { AUDIT_ACTIONS } from '../../audit/audit-actions.constants';
import { AuditActor } from '../../audit/audit-actor.util';

// ── Helper ──────────────────────────────────────────────────────────────────

function toPositiveInt(val: any, fallback: number): number {
  const n = parseInt(String(val));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function requireString(val: any, field: string): string {
  if (!val || typeof val !== 'string' || !val.trim()) {
    throw new BadRequestException(`Le champ "${field}" est requis.`);
  }
  return val.trim();
}

// ── Promotions ───────────────────────────────────────────────────────────────

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any, tenantId: string) {
    requireString(data.articleId, 'articleId');
    requireString(data.nom, 'nom');
    if (!data.dateDebut) throw new BadRequestException('dateDebut est requis');
    if (!data.dateFin) throw new BadRequestException('dateFin est requis');
    const valeur = parseFloat(data.valeur);
    if (!Number.isFinite(valeur) || valeur < 0)
      throw new BadRequestException('valeur invalide');

    return this.prisma.promotion.create({
      data: {
        tenantId,
        articleId: data.articleId,
        nom: data.nom,
        type: data.type || 'POURCENTAGE',
        valeur,
        prixPromo: parseFloat(data.prixPromo) || 0,
        dateDebut: new Date(data.dateDebut),
        dateFin: new Date(data.dateFin),
        actif: data.actif !== undefined ? Boolean(data.actif) : true,
      },
      include: { article: true },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.promotion.findMany({
      where: { tenantId },
      include: { article: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const promotion = await this.prisma.promotion.findFirst({
      where: { id, tenantId },
      include: { article: true },
    });
    if (!promotion) throw new NotFoundException('Promotion non trouvée');
    return promotion;
  }

  async update(id: string, data: any, tenantId: string) {
    await this.findOne(id, tenantId);
    const updateData: any = {};
    if (data.nom !== undefined) updateData.nom = data.nom;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.valeur !== undefined) updateData.valeur = parseFloat(data.valeur);
    if (data.prixPromo !== undefined) updateData.prixPromo = parseFloat(data.prixPromo);
    if (data.dateDebut !== undefined) updateData.dateDebut = new Date(data.dateDebut);
    if (data.dateFin !== undefined) updateData.dateFin = new Date(data.dateFin);
    if (data.actif !== undefined) updateData.actif = Boolean(data.actif);
    if (data.articleId !== undefined) updateData.articleId = data.articleId;

    return this.prisma.promotion.update({
      where: { id },
      data: updateData,
      include: { article: true },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.promotion.delete({ where: { id } });
  }
}

// ── CreditClient ───────────────────────────────────────────────────────────────

@Injectable()
export class CreditClientService {
  constructor(private prisma: PrismaService) {}

  async payerDette(tenantId: string, clientId: string, data: any) {
    const montant = parseFloat(data.montant);
    if (!Number.isFinite(montant) || montant <= 0)
      throw new BadRequestException('montant invalide');
    
    const result = await this.prisma.client.updateMany({
      where: { id: clientId, tenantId },
      data: { soldeCredit: { decrement: montant } },
    });
    if (result.count === 0) {
      throw new NotFoundException('Client introuvable');
    }
    
    return this.prisma.detteClient.create({
      data: {
        montant,
        montantPaye: montant,
        statut: 'SOLDEE',
        clientId,
        tenantId,
        depotId: data.depotId,
      },
    });
  }

  async getDettesClient(tenantId: string, clientId: string) {
    return this.prisma.detteClient.findMany({
      where: { clientId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

// ── Articles ─────────────────────────────────────────────────────────────────

@Injectable()
export class ArticlesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(tenantId: string, params?: any) {
    const page = toPositiveInt(params?.page, 1);
    const limit = toPositiveInt(params?.limit, 50);
    const search = params?.search;
    const categorieId = params?.categorieId;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { designation: { contains: search, mode: 'insensitive' } },
        { codeBarres: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categorieId && categorieId !== '') {
      where.categorieId = categorieId;
    }

    const [data, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        skip,
        take: limit,
        include: { famille: true, marque: true, categorie: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.article.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string) {
    const article = await this.prisma.article.findFirst({
      where: { id, tenantId },
      include: { famille: true, marque: true, categorie: true },
    });
    if (!article) throw new NotFoundException('Article non trouvé');
    return article;
  }

  async create(data: any, tenantId: string) {
    requireString(data.designation, 'designation');
    requireString(data.depotId, 'depotId');
    const prixVente = parseFloat(data.prixVente);
    if (!Number.isFinite(prixVente) || prixVente < 0)
      throw new BadRequestException('prixVente invalide');

    const article = await this.prisma.article.create({
      data: {
        tenantId,
        designation: data.designation.trim(),
        prixVente,
        prixAchat: parseFloat(data.prixAchat) || 0,
        seuilCritique: parseInt(data.seuilCritique) || 0,
        codeBarres: data.codeBarres || null,
        unite: data.unite || 'PIECE',
        familleId: data.familleId || null,
        marqueId: data.marqueId || null,
        categorieId: data.categorieId || null,
        photoUrl: data.photoUrl || null,
      },
      include: { famille: true, marque: true, categorie: true },
    });

    await this.prisma.stock.upsert({
      where: { articleId_depotId: { articleId: article.id, depotId: data.depotId } },
      update: {},
      create: { articleId: article.id, depotId: data.depotId, quantite: 0 }
    });

    return article;
  }

  async update(id: string, data: any, tenantId: string) {
    await this.findOne(id, tenantId);
    const updateData: any = {};
    if (data.designation !== undefined) updateData.designation = data.designation.trim();
    if (data.prixVente !== undefined) updateData.prixVente = parseFloat(data.prixVente);
    if (data.prixAchat !== undefined) updateData.prixAchat = parseFloat(data.prixAchat) || 0;
    if (data.seuilCritique !== undefined) updateData.seuilCritique = parseInt(data.seuilCritique) || 0;
    if (data.codeBarres !== undefined) updateData.codeBarres = data.codeBarres || null;
    if (data.unite !== undefined) updateData.unite = data.unite;
    if (data.familleId !== undefined) updateData.familleId = data.familleId || null;
    if (data.marqueId !== undefined) updateData.marqueId = data.marqueId || null;
    if (data.categorieId !== undefined) updateData.categorieId = data.categorieId || null;
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl || null;

    return this.prisma.article.update({
      where: { id },
      data: updateData,
      include: { famille: true, marque: true, categorie: true },
    });
  }

  async delete(id: string, tenantId: string, actor: AuditActor) {
    const article = await this.findOne(id, tenantId);
    const deleted = await this.prisma.article.delete({ where: { id } });

    await this.auditService
      .logEvent({
        tenantId,
        depotId: actor.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.SUPPRESSION_ARTICLE,
        severite: AuditSeverite.ATTENTION,
        targetType: 'Article',
        targetId: id,
        reference: article.designation,
        description: `Article "${article.designation}" supprimé`,
        valeurAvant: {
          designation: article.designation,
          prixVente: article.prixVente,
          prixAchat: article.prixAchat,
          codeBarres: article.codeBarres,
        },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log SUPPRESSION_ARTICLE:', err));

    return deleted;
  }
}

// ── Stock ────────────────────────────────────────────────────────────────────

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, depotId?: string | null, params?: any) {
    const page = toPositiveInt(params?.page, 1);
    const limit = toPositiveInt(params?.limit, 50);
    const search = params?.search;
    const categorieId = params?.categorieId;
    const skip = (page - 1) * limit;

    const where: any = { article: { tenantId } };
    if (depotId) where.depotId = depotId;
    if (search) {
      where.article = {
        ...where.article,
        designation: { contains: search, mode: 'insensitive' },
      };
    }
    if (categorieId && categorieId !== '') {
      where.article = { ...where.article, categorieId };
    }

    const [data, total] = await Promise.all([
      this.prisma.stock.findMany({
        where,
        skip,
        take: limit,
        include: {
          article: { include: { famille: true, marque: true, categorie: true } },
          depot: true,
        },
        orderBy: { quantite: 'asc' },
      }),
      this.prisma.stock.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}

// ── Clients ──────────────────────────────────────────────────────────────────

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(tenantId: string, params?: any) {
    const page = toPositiveInt(params?.page, 1);
    const limit = toPositiveInt(params?.limit, 50);
    const search = params?.search;
    const depotId = params?.depotId;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (depotId) where.depotId = depotId;
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { telephone: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId },
    });
    if (!client) throw new NotFoundException('Client non trouvé');
    return client;
  }

  async create(data: any, tenantId: string) {
    requireString(data.nom, 'nom');
    return this.prisma.client.create({
      data: {
        tenantId,
        nom: data.nom.trim(),
        telephone: data.telephone || null,
        adresse: data.adresse || null,
        depotId: data.depotId || null,
        plafondCredit: parseFloat(data.plafondCredit) || 0,
        soldeCredit: parseFloat(data.soldeCredit) || 0,
      },
    });
  }

  async update(id: string, data: any, tenantId: string) {
    await this.findOne(id, tenantId);
    const updateData: any = {};
    if (data.nom !== undefined) updateData.nom = data.nom.trim();
    if (data.telephone !== undefined) updateData.telephone = data.telephone || null;
    if (data.adresse !== undefined) updateData.adresse = data.adresse || null;
    if (data.depotId !== undefined) updateData.depotId = data.depotId || null;
    if (data.plafondCredit !== undefined)
      updateData.plafondCredit = parseFloat(data.plafondCredit) || 0;

    return this.prisma.client.update({ where: { id }, data: updateData });
  }

  async delete(id: string, tenantId: string, actor: AuditActor) {
    const client = await this.findOne(id, tenantId);
    const deleted = await this.prisma.client.delete({ where: { id } });

    await this.auditService
      .logEvent({
        tenantId,
        depotId: client.depotId ?? actor.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.SUPPRESSION_CLIENT,
        severite: AuditSeverite.ATTENTION,
        targetType: 'Client',
        targetId: id,
        reference: client.nom,
        description: `Client "${client.nom}" supprimé`,
        valeurAvant: {
          nom: client.nom,
          telephone: client.telephone,
          soldeCredit: client.soldeCredit,
        },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log SUPPRESSION_CLIENT:', err));

    return deleted;
  }
}

// ── Fournisseurs ─────────────────────────────────────────────────────────────

@Injectable()
export class FournisseursService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, params?: any) {
    const page = toPositiveInt(params?.page, 1);
    const limit = toPositiveInt(params?.limit, 50);
    const search = params?.search;
    const depotId = params?.depotId;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (depotId) where.depotId = depotId;
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { telephone: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.fournisseur.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.fournisseur.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string) {
    const fournisseur = await this.prisma.fournisseur.findFirst({
      where: { id, tenantId },
    });
    if (!fournisseur) throw new NotFoundException('Fournisseur non trouvé');
    return fournisseur;
  }

  async create(data: any, tenantId: string) {
    requireString(data.nom, 'nom');
    return this.prisma.fournisseur.create({
      data: {
        tenantId,
        nom: data.nom.trim(),
        telephone: data.telephone || null,
        adresse: data.adresse || null,
        email: data.email || null,
        notes: data.notes || null,
        depotId: data.depotId || null,
      },
    });
  }

  async update(id: string, data: any, tenantId: string) {
    await this.findOne(id, tenantId);
    const updateData: any = {};
    if (data.nom !== undefined) updateData.nom = data.nom.trim();
    if (data.telephone !== undefined) updateData.telephone = data.telephone || null;
    if (data.adresse !== undefined) updateData.adresse = data.adresse || null;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    return this.prisma.fournisseur.update({ where: { id }, data: updateData });
  }

  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.fournisseur.delete({ where: { id } });
  }
}

// ── Dépenses ─────────────────────────────────────────────────────────────────

@Injectable()
export class DepensesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(tenantId: string, params?: any) {
    const page = toPositiveInt(params?.page, 1);
    const limit = toPositiveInt(params?.limit, 50);
    const depotId = params?.depotId;
    const categorie = params?.categorie;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (depotId) where.depotId = depotId;
    if (categorie) where.categorie = categorie;

    const [data, total] = await Promise.all([
      this.prisma.depense.findMany({
        where,
        skip,
        take: limit,
        include: { depot: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.depense.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string) {
    const depense = await this.prisma.depense.findFirst({
      where: { id, tenantId },
      include: { depot: true },
    });
    if (!depense) throw new NotFoundException('Dépense non trouvée');
    return depense;
  }

  async create(data: any, tenantId: string, actor: AuditActor) {
    // Le frontend envoie : libelle (alias motif), montant, categorie, modePaiement (ignoré), notes (ignoré)
    // Le modèle Prisma Depense accepte : categorie, montant, motif, depotId, tenantId
    const montant = parseFloat(data.montant);
    if (!Number.isFinite(montant) || montant <= 0)
      throw new BadRequestException('montant invalide');
    requireString(data.depotId, 'depotId');

    // Map libelle → motif (le frontend peut envoyer l'un ou l'autre)
    const motif = data.libelle || data.motif || '';

    const depense = await this.prisma.depense.create({
      data: {
        tenantId,
        depotId: data.depotId,
        categorie: data.categorie || 'AUTRE',
        montant,
        motif,
      },
      include: { depot: true },
    });

    await this.auditService
      .logEvent({
        tenantId,
        depotId: data.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.DEPENSE_ENREGISTREE,
        severite: AuditSeverite.INFO,
        targetType: 'Depense',
        targetId: depense.id,
        description: `Dépense enregistrée : ${motif || 'sans libellé'} (${montant} FCFA)`,
        valeurApres: { montant, categorie: depense.categorie, motif },
        motif,
        montant: -montant,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log DEPENSE_ENREGISTREE:', err));

    return depense;
  }

  async update(id: string, data: any, tenantId: string) {
    await this.findOne(id, tenantId);
    const updateData: any = {};
    if (data.montant !== undefined) updateData.montant = parseFloat(data.montant);
    if (data.categorie !== undefined) updateData.categorie = data.categorie;
    if (data.libelle !== undefined || data.motif !== undefined) {
      updateData.motif = data.libelle || data.motif || '';
    }

    return this.prisma.depense.update({
      where: { id },
      data: updateData,
      include: { depot: true },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.depense.delete({ where: { id } });
  }
}

// ── Ventes ────────────────────────────────────────────────────────────────────

@Injectable()
export class VentesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async createVente(tenantId: string, data: any, actor: AuditActor) {
    requireString(data.depotId, 'depotId');
    if (!Array.isArray(data.panier) || data.panier.length === 0) {
      throw new BadRequestException('Le panier est vide ou invalide');
    }

    // Calculer le total côté serveur pour éviter la manipulation
    const sousTotal = data.panier.reduce((sum: number, item: any) => {
      const prix = parseFloat(item.prix) || 0;
      const quantite = parseInt(item.quantite) || 0;
      const remise = parseFloat(item.remise) || 0;
      return sum + prix * quantite * (1 - remise / 100);
    }, 0);

    const remiseGlobale = parseFloat(data.remiseGlobale) || 0;
    const total = sousTotal * (1 - remiseGlobale / 100);

    if (!Number.isFinite(total) || total <= 0)
      throw new BadRequestException('Total de vente invalide');

    const reference = `VENTE-${Date.now()}`;

    const vente = await this.prisma.$transaction(async (tx) => {
      const v = await tx.vente.create({
        data: {
          reference,
          total: Math.round(total * 100) / 100,
          statut: 'PAYE',
          modePaiement: data.modePaiement || 'CASH',
          tenantId,
          depotId: data.depotId,
          clientId: data.clientId || null,
          createurId: actor.userId || null,
          date: new Date(),
          lignes: {
            create: data.panier.map((item: any) => ({
              articleId: item.articleId,
              quantite: parseInt(item.quantite),
              prix: parseFloat(item.prix),
              remise: parseFloat(item.remise) || 0,
              total:
                parseFloat(item.prix) *
                parseInt(item.quantite) *
                (1 - (parseFloat(item.remise) || 0) / 100),
            })),
          },
        },
        include: {
          lignes: { include: { article: { select: { designation: true } } } },
          client: true,
        },
      });

      // Décrémenter le stock et créer les mouvements
      for (const item of data.panier) {
        const articleId = item.articleId;
        const qte = parseInt(item.quantite);

        const stock = await tx.stock.findFirst({
          where: { articleId, depotId: data.depotId },
        });
        if (!stock) {
          throw new BadRequestException(`Stock introuvable pour l'article ${articleId}`);
        }
        if (stock.quantite < qte) {
          throw new BadRequestException(`Stock insuffisant pour l'article ${articleId}`);
        }

        const decremente = await tx.stock.updateMany({
          where: { articleId, depotId: data.depotId, quantite: { gte: qte } },
          data: { quantite: { decrement: qte } },
        });
        if (decremente.count === 0) {
          // Concurrence : le stock a changé entre la vérification et la
          // décrémentation. On fait échouer toute la transaction plutôt
          // que de vendre un article qu'on n'a plus en stock (auparavant
          // ce cas passait silencieusement : la vente était créée sans
          // jamais toucher le stock réel).
          throw new ConflictException(
            `Stock modifié entre-temps pour l'article ${articleId}, veuillez réessayer`,
          );
        }
        await tx.mouvementStock.create({
          data: {
            type: 'SORTIE_VENTE',
            quantite: parseInt(item.quantite),
            articleId: item.articleId,
            depotId: data.depotId,
            tenantId,
            motif: `Vente ${reference}`,
          },
        });
      }

      return v;
    });

    await this.auditService
      .logEvent({
        tenantId,
        depotId: data.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.VENTE_CREEE,
        severite: AuditSeverite.INFO,
        targetType: 'Vente',
        targetId: vente.id,
        reference: vente.reference,
        description: `Vente ${vente.reference} créée (${vente.lignes.length} article(s), ${vente.total} FCFA)`,
        valeurApres: {
          total: vente.total,
          modePaiement: vente.modePaiement,
          nbArticles: vente.lignes.length,
        },
        montant: vente.total,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log VENTE_CREEE:', err));

    if (remiseGlobale > 0) {
      const montantRemise = Math.round((sousTotal - total) * 100) / 100;
      await this.auditService
        .logEvent({
          tenantId,
          depotId: data.depotId,
          actorUserId: actor.userId,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: AUDIT_ACTIONS.REMISE_ACCORDEE,
          severite: AuditSeverite.ATTENTION,
          targetType: 'Vente',
          targetId: vente.id,
          reference: vente.reference,
          description: `Remise de ${remiseGlobale}% accordée sur la vente ${vente.reference} (-${montantRemise} FCFA)`,
          valeurApres: { remiseGlobale, montantRemise },
          montant: -montantRemise,
          ipAddress: actor.ip,
          userAgent: actor.userAgent,
        })
        .catch((err) => console.error('[Audit] Échec log REMISE_ACCORDEE:', err));
    }

    return vente;
  }

  async findAll(tenantId: string, params?: any) {
    const page = toPositiveInt(params?.page, 1);
    const limit = toPositiveInt(params?.limit, 50);

    // Statut peut être filtré depuis les alias (ex: factures = PAYE)
    const statut = params?.statut;
    const clientId = params?.clientId;
    const depotId = params?.depotId;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    // Par défaut : si une couche supérieure impose un statut, on l'applique.
    // (Pour factures, le controller force statut='PAYE')
    if (statut) where.statut = statut;

    if (clientId) where.clientId = clientId;
    if (depotId) where.depotId = depotId;

    const [data, total] = await Promise.all([
      this.prisma.vente.findMany({
        where,
        skip,
        take: limit,
        include: {
          lignes: { include: { article: { select: { designation: true } } } },
          client: { select: { nom: true } },
        },
        orderBy: { date: 'desc' },
      }),
      this.prisma.vente.count({ where }),
    ]);

    return { data, total, page, limit };
  }


  async findOne(id: string, tenantId: string) {
    const vente = await this.prisma.vente.findFirst({
      where: { id, tenantId },
      include: {
        lignes: { include: { article: { select: { designation: true } } } },
        client: true,
      },
    });
    if (!vente) throw new NotFoundException('Vente non trouvée');
    return vente;
  }

  async annulerVente(id: string, tenantId: string, motif: string | undefined, actor: AuditActor) {
    const vente = await this.prisma.vente.findFirst({
      where: { id, tenantId },
      include: { lignes: true },
    });
    if (!vente) throw new NotFoundException('Vente non trouvée');
    if (vente.statut === 'ANNULE')
      throw new BadRequestException('Cette vente est déjà annulée');

    const motifFinal = motif || 'Annulation manuelle';

    await this.prisma.$transaction(async (tx) => {
      await tx.vente.update({
        where: { id },
        data: { statut: 'ANNULE', motifAnnulation: motifFinal },
      });
      // Réintégrer le stock
      for (const ligne of vente.lignes) {
        await tx.stock.updateMany({
          where: { articleId: ligne.articleId, depotId: vente.depotId },
          data: { quantite: { increment: ligne.quantite } },
        });
      }
    });

    await this.auditService
      .logEvent({
        tenantId,
        depotId: vente.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.VENTE_ANNULEE,
        severite: AuditSeverite.CRITIQUE,
        targetType: 'Vente',
        targetId: vente.id,
        reference: vente.reference,
        description: `Vente ${vente.reference} annulée (${vente.total} FCFA) — motif : ${motifFinal}`,
        valeurAvant: { statut: vente.statut, total: vente.total },
        valeurApres: { statut: 'ANNULE', motif: motifFinal },
        motif: motifFinal,
        montant: -vente.total,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log VENTE_ANNULEE:', err));

    return { success: true };
  }

  // ── Rapports ───────────────────────────────────────────────────────────────

  async getRapports(
    tenantId: string,
    periode?: string,
    dateDebut?: string,
    dateFin?: string,
  ) {
    const end = dateFin ? new Date(dateFin) : new Date();
    const start = dateDebut
      ? new Date(dateDebut)
      : periode === 'mois'
        ? new Date(end.getFullYear(), end.getMonth(), 1)
        : periode === 'annee'
          ? new Date(end.getFullYear(), 0, 1)
          : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [ventes, depenses, totalVentes, totalDepenses, topArticles] =
      await Promise.all([
        this.prisma.vente.findMany({
          where: { tenantId, date: { gte: start, lte: end }, statut: 'PAYE' },
          include: { lignes: { include: { article: true } } },
          orderBy: { date: 'desc' },
        }),
        this.prisma.depense.findMany({
          where: { tenantId, createdAt: { gte: start, lte: end } },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.vente.aggregate({
          where: { tenantId, date: { gte: start, lte: end }, statut: 'PAYE' },
          _sum: { total: true },
        }),
        this.prisma.depense.aggregate({
          where: { tenantId, createdAt: { gte: start, lte: end } },
          _sum: { montant: true },
        }),
        this.prisma.ligneVente.groupBy({
          by: ['articleId'],
          where: {
            vente: { tenantId, date: { gte: start, lte: end }, statut: 'PAYE' },
          },
          _sum: { quantite: true, total: true },
          orderBy: { _sum: { quantite: 'desc' } },
          take: 10,
        }),
      ]);

    const chiffreAffaires = totalVentes._sum.total ?? 0;
    const totalDep = totalDepenses._sum.montant ?? 0;

    return {
      periode: { debut: start, fin: end },
      chiffreAffaires,
      totalDepenses: totalDep,
      benefice: chiffreAffaires - totalDep,
      ventes,
      depenses,
      topArticles,
    };
  }

  // ── Stats / Dashboard ─────────────────────────────────────────────────────

  async getStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [ventesJour, caJour, clientsActifs, stockCritique, totalProduits] =
      await this.prisma.$transaction([
        this.prisma.vente.count({
          where: { tenantId, date: { gte: today }, statut: 'PAYE' },
        }),
        this.prisma.vente.aggregate({
          where: { tenantId, date: { gte: today }, statut: 'PAYE' },
          _sum: { total: true },
        }),
        this.prisma.client.count({ where: { tenantId } }),
        this.prisma.stock.count({
          where: {
            article: { tenantId },
            OR: [
              { quantite: { lte: 0 } },
              {
                AND: [
                  { quantite: { gt: 0 } },
                  { seuilCritique: { not: null } },
                ],
              },
            ],
          },
        }),
        this.prisma.article.count({ where: { tenantId } }),
      ]);

    return {
      ventesJour,
      caJour: caJour._sum.total ?? 0,
      clientsActifs,
      stockCritique,
      totalProduits,
      caisseJour: caJour._sum.total ?? 0,
    };
  }

  // ── Catégories ────────────────────────────────────────────────────────────

  async findAllCategories(tenantId: string, query?: any) {
    return this.prisma.categorie.findMany({
      where: { tenantId, actif: true },
      orderBy: [{ ordre: 'asc' }, { nom: 'asc' }],
      include: { _count: { select: { articles: true } } },
    });
  }

  async findOneCategorie(tenantId: string, id: string) {
    const cat = await this.prisma.categorie.findFirst({
      where: { id, tenantId },
      include: { articles: true },
    });
    if (!cat) throw new NotFoundException(`Catégorie ${id} introuvable`);
    return cat;
  }

  async createCategorie(tenantId: string, dto: any) {
    requireString(dto.nom, 'nom');
    return this.prisma.categorie.create({
      data: {
        tenantId,
        nom: dto.nom.trim(),
        description: dto.description || null,
        couleur: dto.couleur || '#6366f1',
        icone: dto.icone || '🏷️',
        actif: dto.actif !== undefined ? Boolean(dto.actif) : true,
        ordre: Number.isFinite(Number(dto.ordre)) ? Number(dto.ordre) : 0,
      },
    });
  }

  async updateCategorie(tenantId: string, id: string, dto: any) {
    await this.findOneCategorie(tenantId, id);
    const updateData: any = {};
    if (dto.nom !== undefined) updateData.nom = dto.nom.trim();
    if (dto.description !== undefined) updateData.description = dto.description || null;
    if (dto.couleur !== undefined) updateData.couleur = dto.couleur;
    if (dto.icone !== undefined) updateData.icone = dto.icone;
    if (dto.actif !== undefined) updateData.actif = Boolean(dto.actif);
    if (dto.ordre !== undefined) {
      const n = Number(dto.ordre);
      updateData.ordre = Number.isFinite(n) ? n : 0;
    }
    return this.prisma.categorie.update({ where: { id }, data: updateData });
  }

  async deleteCategorie(tenantId: string, id: string) {
    await this.findOneCategorie(tenantId, id);
    const count = await this.prisma.article.count({
      where: { categorieId: id, tenantId },
    });
    if (count > 0) {
      throw new BadRequestException(
        `Impossible de supprimer : ${count} article(s) utilisent cette catégorie`,
      );
    }
    return this.prisma.categorie.delete({ where: { id } });
  }

  async seedCategoriesByType(tenantId: string, typeBoutique: string) {
    const cats =
      CATEGORIES_PAR_TYPE[typeBoutique] ?? CATEGORIES_PAR_TYPE.generique;
    const created = await this.prisma.$transaction(
      cats.map((cat, index) =>
        this.prisma.categorie.create({
          data: { ...cat, tenantId, ordre: index },
        }),
      ),
    );
    return { created: created.length, type: typeBoutique };
  }

  // ── Caisse ───────────────────────────────────────────────
  async getCaisseStatut(tenantId: string, depotId?: string) {
    const where: any = { tenantId, estOuverte: true };
    if (depotId) where.depotId = depotId;
    const session = await this.prisma.sessionCaisse.findFirst({
      where,
      include: { mouvements: { orderBy: { createdAt: 'desc' }, take: 50 } },
    });
    const mouvements = session?.mouvements || [];
    const entreesJour = mouvements
      .filter((m) => m.type.startsWith('ENCAISSEMENT'))
      .reduce((s, m) => s + m.montant, 0);
    const sortiesJour = mouvements
      .filter((m) => m.type.startsWith('DECAISSEMENT'))
      .reduce((s, m) => s + m.montant, 0);
    return {
      statut: session ? 'OUVERTE' : 'FERMEE',
      solde: session ? session.fondInitial + entreesJour - sortiesJour : 0,
      entreesJour,
      sortiesJour,
      mouvements,
    };
  }

  async ouvrirCaisse(tenantId: string, data: any, actor: AuditActor) {
    requireString(data.depotId, 'depotId');
    requireString(data.userId, 'userId');
    const existing = await this.prisma.sessionCaisse.findFirst({
      where: { tenantId, depotId: data.depotId, estOuverte: true },
    });
    if (existing) throw new ConflictException('Une caisse est deja ouverte');
    const session = await this.prisma.sessionCaisse.create({
      data: {
        fondInitial: parseFloat(data.montantInitial) || 0,
        depotId: data.depotId,
        userId: data.userId,
        tenantId,
        estOuverte: true,
      },
    });

    await this.auditService
      .logEvent({
        tenantId,
        depotId: data.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.CAISSE_OUVERTE,
        severite: AuditSeverite.INFO,
        targetType: 'SessionCaisse',
        targetId: session.id,
        description: `Caisse ouverte avec un fond initial de ${session.fondInitial} FCFA`,
        valeurApres: { fondInitial: session.fondInitial },
        montant: session.fondInitial,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log CAISSE_OUVERTE:', err));

    return session;
  }

  async fermerCaisse(tenantId: string, data: any, actor: AuditActor) {
    const session = await this.prisma.sessionCaisse.findFirst({
      where: { tenantId, depotId: data.depotId, estOuverte: true },
    });
    if (!session) {
      throw new BadRequestException('Aucune session de caisse ouverte à fermer.');
    }

    const result = await this.prisma.sessionCaisse.updateMany({
      where: { tenantId, depotId: data.depotId, estOuverte: true },
      data: {
        estOuverte: false,
        dateCloture: new Date(),
        fondFinal: data.fondFinal,
        ecart: data.ecart,
      },
    });
    if (result.count === 0) {
      throw new BadRequestException('Aucune session de caisse ouverte à fermer.');
    }

    await this.auditService
      .logEvent({
        tenantId,
        depotId: data.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.CAISSE_FERMEE,
        severite: data.ecart ? AuditSeverite.ATTENTION : AuditSeverite.INFO,
        targetType: 'SessionCaisse',
        targetId: session.id,
        description: `Caisse fermée — fond final ${data.fondFinal ?? 0} FCFA${
          data.ecart ? `, écart de ${data.ecart} FCFA` : ''
        }`,
        valeurAvant: { fondInitial: session.fondInitial, estOuverte: true },
        valeurApres: {
          fondFinal: data.fondFinal ?? null,
          ecart: data.ecart ?? null,
          estOuverte: false,
        },
        montant: data.ecart ?? null,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log CAISSE_FERMEE:', err));

    return result;
  }

  async mouvementCaisse(tenantId: string, data: any, actor: AuditActor) {
    const session = await this.prisma.sessionCaisse.findFirst({
      where: { tenantId, depotId: data.depotId, estOuverte: true },
    });
    if (!session) throw new BadRequestException('Caisse non ouverte');

    const montant = parseFloat(data.montant);
    const estEntree = data.typeMouvement === 'ENTREE';
    const motif = data.motif || 'Mouvement';

    const mouvement = await this.prisma.mouvementCaisse.create({
      data: {
        type: estEntree ? 'ENCAISSEMENT_VENTE' : 'DECAISSEMENT_DEPENSE',
        montant,
        motif,
        sessionId: session.id,
      },
    });

    await this.auditService
      .logEvent({
        tenantId,
        depotId: data.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: estEntree ? AUDIT_ACTIONS.ENTREE_CAISSE : AUDIT_ACTIONS.SORTIE_CAISSE,
        severite: AuditSeverite.INFO,
        targetType: 'MouvementCaisse',
        targetId: mouvement.id,
        description: `${estEntree ? 'Entrée' : 'Sortie'} de caisse de ${montant} FCFA — motif : ${motif}`,
        valeurApres: { montant, motif },
        motif,
        montant: estEntree ? montant : -montant,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log mouvement caisse:', err));

    return mouvement;
  }

  async rapportJournalier(tenantId: string, depotId?: string) {
    return this.getCaisseStatut(tenantId, depotId);
  }
}