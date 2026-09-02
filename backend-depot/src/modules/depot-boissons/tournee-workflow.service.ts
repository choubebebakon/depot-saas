import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TypeMouvement } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma.service';

const PLANIFIEE = 'PLANIFIEE';
const EN_COURS = 'EN_COURS';
const CLOTUREE = 'CLOTUREE';
const SERIALIZABLE_RETRIES = 3;

@Injectable()
export class TourneeWorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  private assertPositiveInt(value: unknown, label: string) {
    if (!Number.isInteger(value) || Number(value) <= 0) throw new BadRequestException(`${label} doit être un entier supérieur à 0.`);
  }
  private assertNonNegativeInt(value: unknown, label: string) {
    if (!Number.isInteger(value) || Number(value) < 0) throw new BadRequestException(`${label} doit être un entier supérieur ou égal à 0.`);
  }
  private assertMoney(value: unknown, label: string) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new BadRequestException(`${label} est invalide.`);
  }
  private async serializable<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < SERIALIZABLE_RETRIES; attempt += 1) {
      try {
        return await this.prisma.$transaction(work, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 15000,
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' && attempt < SERIALIZABLE_RETRIES - 1) continue;
        throw error;
      }
    }
    throw new ConflictException('La transaction de tournée n’a pas pu être finalisée après plusieurs tentatives.');
  }

  async list(tenantId: string, depotId: string) {
    return (await this.prisma.$queryRaw`
      SELECT w.*, json_build_object('id', t.id, 'nom', t.nom) AS tricycle,
        json_build_object('id', u.id, 'nom', u.nom, 'email', u.email) AS commercial,
        json_build_object('id', d.id, 'nom', d.nom) AS depot
      FROM "TourneeWorkflow" w JOIN "Tricycle" t ON t.id=w."tricycleId"
      JOIN "User" u ON u.id=w."commercialId" JOIN "Depot" d ON d.id=w."depotId"
      WHERE w."tenantId"=${tenantId} AND w."depotId"=${depotId}
      ORDER BY w."datePlanifiee" DESC`) as unknown[];
  }

  async get(tenantId: string, depotId: string, id: string) {
    const rows = (await this.prisma.$queryRaw`
      SELECT w.*, json_build_object('id', t.id, 'nom', t.nom) AS tricycle,
        json_build_object('id', u.id, 'nom', u.nom, 'email', u.email) AS commercial,
        json_build_object('id', d.id, 'nom', d.nom) AS depot,
        COALESCE((SELECT json_agg(json_build_object(
          'id', l.id, 'articleId', l."articleId", 'designation', a.designation, 'format', a.format,
          'estConsigne', a."estConsigne", 'quantiteChargee', l."quantiteChargee", 'prixUnitaireFacture', l."prixUnitaireFacture",
          'quantiteRetourPleins', l."quantiteRetourPleins", 'quantiteRetourVides', l."quantiteRetourVides",
          'quantiteVendueTheorique', l."quantiteVendueTheorique", 'caTheorique', l."caTheorique"
        ) ORDER BY a.designation) FROM "TourneeWorkflowLine" l JOIN "Article" a ON a.id=l."articleId" WHERE l."workflowId"=w.id), '[]'::json) AS lignes,
        (SELECT json_build_object('id', dc.id, 'reference', dc.reference, 'montant', dc.montant, 'montantPaye', dc."montantPaye", 'statut', dc.statut) FROM "DetteCommerciale" dc WHERE dc."workflowId"=w.id) AS dette,
        COALESCE((SELECT json_agg(json_build_object('articleId', cs."articleId", 'quantite', cs.quantite)) FROM "DepotConsigneStock" cs WHERE cs."tenantId"=w."tenantId" AND cs."depotId"=w."depotId"), '[]'::json) AS stockConsignes
      FROM "TourneeWorkflow" w JOIN "Tricycle" t ON t.id=w."tricycleId" JOIN "User" u ON u.id=w."commercialId" JOIN "Depot" d ON d.id=w."depotId"
      WHERE w.id=${id} AND w."tenantId"=${tenantId} AND w."depotId"=${depotId} LIMIT 1`) as unknown[];
    if (!rows[0]) throw new NotFoundException('Tournée introuvable dans le dépôt actif.');
    return rows[0];
  }

  async create(tenantId: string, depotId: string, data: { tricycleId: string; commercialId: string; date?: string }) {
    if (!data?.tricycleId || !data?.commercialId) throw new BadRequestException('Tricycle et commercial sont obligatoires.');
    const date = data.date ? new Date(data.date) : new Date();
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Date de tournée invalide.');
    return this.serializable(async (tx) => {
      const depot = await tx.depot.findFirst({ where: { id: depotId, tenantId }, select: { id: true } });
      if (!depot) throw new NotFoundException('Dépôt actif introuvable.');
      const [tricycle, commercial] = await Promise.all([
        tx.tricycle.findFirst({ where: { id: data.tricycleId, tenantId, depotId }, select: { id: true, nom: true, estLibre: true } }),
        tx.user.findFirst({ where: { id: data.commercialId, tenantId, depotId, role: 'COMMERCIAL' }, select: { id: true, nom: true, email: true } }),
      ]);
      if (!tricycle) throw new NotFoundException('Tricycle introuvable dans ce dépôt.');
      if (!tricycle.estLibre) throw new ConflictException('Ce tricycle est déjà affecté à une tournée.');
      if (!commercial) throw new NotFoundException('Commercial introuvable dans ce dépôt.');
      const locked = await tx.tricycle.updateMany({ where: { id: tricycle.id, tenantId, depotId, estLibre: true }, data: { estLibre: false } });
      if (locked.count !== 1) throw new ConflictException('Le tricycle vient d’être affecté à une autre tournée.');
      const reference = `TRN-${date.toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID().slice(0, 8).toUpperCase()}`;
      const tournee = await tx.tournee.create({ data: { reference, statut: 'OUVERTE', dateOuverture: date, depotId, tricycleId: data.tricycleId, commercialId: data.commercialId, tenantId }, select: { id: true } });
      const workflowId = randomUUID();
      await tx.$executeRaw`INSERT INTO "TourneeWorkflow" ("id","reference","statut","tenantId","depotId","tricycleId","commercialId","tourneeId","datePlanifiee") VALUES (${workflowId},${reference},${PLANIFIEE},${tenantId},${depotId},${data.tricycleId},${data.commercialId},${tournee.id},${date})`;
      return { id: workflowId, reference, statut: PLANIFIEE };
    });
  }

  async update(tenantId: string, depotId: string, id: string, data: { tricycleId: string; commercialId: string; date?: string }) {
    const current = await this.get(tenantId, depotId, id) as Record<string, any>;
    if (current.statut !== PLANIFIEE) throw new ConflictException('Une tournée démarrée ou clôturée ne peut plus être modifiée.');
    if (!data?.tricycleId || !data?.commercialId) throw new BadRequestException('Tricycle et commercial obligatoires.');
    const date = new Date(data.date || current.datePlanifiee);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Date invalide.');
    return this.serializable(async (tx) => {
      const workflowRows = (await tx.$queryRaw`SELECT * FROM "TourneeWorkflow" WHERE id=${id} AND "tenantId"=${tenantId} AND "depotId"=${depotId} FOR UPDATE`) as Record<string, any>[];
      const workflow = workflowRows[0];
      if (!workflow || workflow.statut !== PLANIFIEE) throw new ConflictException('La tournée a changé d’état et ne peut plus être modifiée.');
      const [oldTricycle, newTricycle, commercial] = await Promise.all([
        tx.tricycle.findFirst({ where: { id: workflow.tricycleId, tenantId, depotId }, select: { id: true, estLibre: true } }),
        tx.tricycle.findFirst({ where: { id: data.tricycleId, tenantId, depotId }, select: { id: true, estLibre: true } }),
        tx.user.findFirst({ where: { id: data.commercialId, tenantId, depotId, role: 'COMMERCIAL' }, select: { id: true } }),
      ]);
      if (!newTricycle) throw new NotFoundException('Nouveau tricycle introuvable.');
      if (!commercial) throw new NotFoundException('Commercial introuvable.');
      if (newTricycle.id !== workflow.tricycleId && !newTricycle.estLibre) throw new ConflictException('Le nouveau tricycle est déjà affecté.');
      if (oldTricycle && oldTricycle.id !== newTricycle.id) {
        const released = await tx.tricycle.updateMany({ where: { id: oldTricycle.id, tenantId, depotId, estLibre: false }, data: { estLibre: true } });
        if (released.count !== 1) throw new ConflictException('Le tricycle actuel ne peut pas être libéré.');
        const acquired = await tx.tricycle.updateMany({ where: { id: newTricycle.id, tenantId, depotId, estLibre: true }, data: { estLibre: false } });
        if (acquired.count !== 1) throw new ConflictException('Le nouveau tricycle vient d’être affecté.');
      }
      await tx.tournee.update({ where: { id: workflow.tourneeId }, data: { tricycleId: data.tricycleId, commercialId: data.commercialId, dateOuverture: date } });
      const changed = await tx.$executeRaw`UPDATE "TourneeWorkflow" SET "tricycleId"=${data.tricycleId}, "commercialId"=${data.commercialId}, "datePlanifiee"=${date}, "updatedAt"=CURRENT_TIMESTAMP WHERE id=${id} AND "tenantId"=${tenantId} AND "depotId"=${depotId} AND "statut"=${PLANIFIEE}`;
      if (changed !== 1) throw new ConflictException('La tournée a changé d’état pendant la modification.');
      return { id, statut: PLANIFIEE };
    });
  }

  async addLine(tenantId: string, depotId: string, id: string, data: { articleId: string; quantiteChargee: number; prixUnitaireFacture?: number }) {
    this.assertPositiveInt(data?.quantiteChargee, 'Quantité chargée');
    const current = await this.get(tenantId, depotId, id) as Record<string, any>;
    if (current.statut !== PLANIFIEE) throw new ConflictException('Le chargement est verrouillé après le départ.');
    return this.serializable(async (tx) => {
      const workflowRows = (await tx.$queryRaw`SELECT id, "statut" FROM "TourneeWorkflow" WHERE id=${id} AND "tenantId"=${tenantId} AND "depotId"=${depotId} FOR UPDATE`) as Record<string, any>[];
      const workflow = workflowRows[0];
      if (!workflow) throw new NotFoundException('Tournée introuvable.');
      if (workflow.statut !== PLANIFIEE) throw new ConflictException('Le chargement est verrouillé après le départ.');
      const article = await tx.article.findFirst({ where: { id: data.articleId, tenantId }, select: { id: true, designation: true, prixVente: true } });
      if (!article) throw new NotFoundException('Article introuvable.');
      const stock = await tx.stock.findFirst({ where: { articleId: article.id, depotId }, select: { quantite: true } });
      if (!stock || stock.quantite < data.quantiteChargee) throw new ConflictException(`Stock insuffisant pour ${article.designation}. Disponible : ${stock?.quantite ?? 0}.`);
      const price = data.prixUnitaireFacture ?? article.prixVente;
      this.assertMoney(price, 'Prix unitaire');
      const result = await tx.$executeRaw`INSERT INTO "TourneeWorkflowLine" ("id","workflowId","articleId","quantiteChargee","prixUnitaireFacture") SELECT ${randomUUID()}, ${id}, ${article.id}, ${data.quantiteChargee}, ${price} WHERE NOT EXISTS (SELECT 1 FROM "TourneeWorkflowLine" WHERE "workflowId"=${id} AND "articleId"=${article.id})`;
      if (result !== 1) throw new ConflictException('Cet article est déjà présent dans le chargement. Modifiez ou retirez la ligne existante.');
      return { id, articleId: article.id, quantiteChargee: data.quantiteChargee, prixUnitaireFacture: price };
    });
  }

  async removeLine(tenantId: string, depotId: string, id: string, lineId: string) {
    return this.serializable(async (tx) => {
      const workflowRows = (await tx.$queryRaw`SELECT "statut" FROM "TourneeWorkflow" WHERE id=${id} AND "tenantId"=${tenantId} AND "depotId"=${depotId} FOR UPDATE`) as Record<string, any>[];
      const workflow = workflowRows[0];
      if (!workflow) throw new NotFoundException('Tournée introuvable.');
      if (workflow.statut !== PLANIFIEE) throw new ConflictException('Le chargement est verrouillé après le départ.');
      const result = await tx.$executeRaw`DELETE FROM "TourneeWorkflowLine" WHERE id=${lineId} AND "workflowId"=${id}`;
      if (result !== 1) throw new NotFoundException('Ligne de chargement introuvable.');
      return { id, lineId, removed: true };
    });
  }

  async depart(tenantId: string, depotId: string, id: string) {
    return this.serializable(async (tx) => {
      const rows = (await tx.$queryRaw`SELECT * FROM "TourneeWorkflow" WHERE id=${id} AND "tenantId"=${tenantId} AND "depotId"=${depotId} FOR UPDATE`) as Record<string, any>[];
      const workflow = rows[0];
      if (!workflow) throw new NotFoundException('Tournée introuvable.');
      if (workflow.statut !== PLANIFIEE) throw new ConflictException('Cette tournée n’est plus planifiable.');
      const lines = (await tx.$queryRaw`SELECT * FROM "TourneeWorkflowLine" WHERE "workflowId"=${id} ORDER BY "createdAt"`) as Record<string, any>[];
      if (!lines.length) throw new BadRequestException('Ajoutez au moins un article avant de valider le départ.');
      let totalQty = 0;
      let totalValue = 0;
      for (const line of lines) {
        const article = await tx.article.findFirst({ where: { id: line.articleId, tenantId }, select: { designation: true } });
        if (!article) throw new NotFoundException('Article de chargement introuvable.');
        const quantity = Number(line.quantiteChargee);
        if (!Number.isInteger(quantity) || quantity <= 0) throw new BadRequestException('Une quantité de chargement est invalide.');
        const result = await tx.stock.updateMany({ where: { articleId: line.articleId, depotId, quantite: { gte: quantity } }, data: { quantite: { decrement: quantity } } });
        if (result.count !== 1) throw new ConflictException(`Stock insuffisant ou modifié simultanément pour ${article.designation}.`);
        await tx.mouvementStock.create({ data: { type: TypeMouvement.SORTIE, quantite: quantity, motif: `Chargement tournée ${workflow.reference}`, articleId: line.articleId, depotId, tenantId, tourneeId: workflow.tourneeId } });
        await tx.ligneChargement.create({ data: { quantiteChargee: quantity, articleId: line.articleId, tourneeId: workflow.tourneeId } });
        totalQty += quantity;
        totalValue += quantity * Number(line.prixUnitaireFacture);
      }
      const changed = await tx.$executeRaw`UPDATE "TourneeWorkflow" SET "statut"=${EN_COURS}, "dateDepart"=CURRENT_TIMESTAMP, "totalQuantiteChargee"=${totalQty}, "totalValeurChargee"=${totalValue}, "updatedAt"=CURRENT_TIMESTAMP WHERE id=${id} AND "statut"=${PLANIFIEE}`;
      if (changed !== 1) throw new ConflictException('La tournée a changé d’état pendant la validation du départ.');
      await tx.tournee.update({ where: { id: workflow.tourneeId }, data: { statut: 'OUVERTE', dateOuverture: new Date() } });
      return { id, statut: EN_COURS, reference: workflow.reference };
    });
  }

  async reconcile(tenantId: string, depotId: string, id: string, data: { lignes: Array<{ lineId: string; quantiteRetourPleins: number; quantiteRetourVides: number }>; cashReel: number; orangeMoneyReel: number; mtnMomoReel: number }) {
    return this.serializable(async (tx) => {
      const workflowRows = (await tx.$queryRaw`SELECT * FROM "TourneeWorkflow" WHERE id=${id} AND "tenantId"=${tenantId} AND "depotId"=${depotId} FOR UPDATE`) as Record<string, any>[];
      const workflow = workflowRows[0];
      if (!workflow) throw new NotFoundException('Tournée introuvable.');
      if (workflow.statut !== EN_COURS) throw new ConflictException('La tournée doit être en cours pour enregistrer le retour.');
      if (!Array.isArray(data?.lignes)) throw new BadRequestException('Les lignes de retour sont obligatoires.');
      this.assertMoney(data.cashReel ?? 0, 'Cash réel');
      this.assertMoney(data.orangeMoneyReel ?? 0, 'Orange Money réel');
      this.assertMoney(data.mtnMomoReel ?? 0, 'MTN MoMo réel');
      const dbLines = (await tx.$queryRaw`SELECT l.*, a."estConsigne" FROM "TourneeWorkflowLine" l JOIN "Article" a ON a.id=l."articleId" WHERE l."workflowId"=${id}`) as Record<string, any>[];
      if (data.lignes.length !== dbLines.length) throw new BadRequestException('Toutes les lignes chargées doivent être renseignées une seule fois.');
      const byId = new Map(dbLines.map((line) => [line.id, line]));
      const seen = new Set<string>();
      let caTheorique = 0;
      let ecartStock = 0;
      for (const input of data.lignes) {
        if (seen.has(input.lineId)) throw new BadRequestException('Une ligne de retour est renseignée plusieurs fois.');
        seen.add(input.lineId);
        const line = byId.get(input.lineId);
        if (!line) throw new BadRequestException('Une ligne de retour est invalide.');
        this.assertNonNegativeInt(input.quantiteRetourPleins, 'Retour pleins');
        this.assertNonNegativeInt(input.quantiteRetourVides, 'Retour vides');
        const retourPleins = Number(input.quantiteRetourPleins);
        const retourVides = Number(input.quantiteRetourVides);
        const chargee = Number(line.quantiteChargee);
        if (retourPleins > chargee) throw new BadRequestException('Le retour plein ne peut pas dépasser la quantité chargée.');
        const vendue = chargee - retourPleins;
        if (line.estConsigne && retourVides > vendue) throw new BadRequestException('Le retour de vides ne peut pas dépasser la quantité vendue théorique.');
        if (!line.estConsigne && retourVides > 0) throw new BadRequestException('Cet article n’est pas consigné et ne peut pas avoir de retour de vides.');
        const ca = vendue * Number(line.prixUnitaireFacture);
        caTheorique += ca;
        ecartStock += chargee - vendue - retourPleins;
        await tx.$executeRaw`UPDATE "TourneeWorkflowLine" SET "quantiteRetourPleins"=${retourPleins}, "quantiteRetourVides"=${retourVides}, "quantiteVendueTheorique"=${vendue}, "caTheorique"=${ca} WHERE id=${line.id} AND "workflowId"=${id}`;
      }
      if (seen.size !== dbLines.length) throw new BadRequestException('Une ou plusieurs lignes de chargement manquent dans le rapprochement.');
      const cash = Number(data.cashReel ?? 0);
      const om = Number(data.orangeMoneyReel ?? 0);
      const momo = Number(data.mtnMomoReel ?? 0);
      const total = cash + om + momo;
      const ecart = total - caTheorique;
      const updated = await tx.$executeRaw`UPDATE "TourneeWorkflow" SET "cashReel"=${cash}, "orangeMoneyReel"=${om}, "mtnMomoReel"=${momo}, "montantEncaisseReel"=${total}, "caTheorique"=${caTheorique}, "ecartCaisse"=${ecart}, "reconciledAt"=CURRENT_TIMESTAMP, "updatedAt"=CURRENT_TIMESTAMP WHERE id=${id} AND "tenantId"=${tenantId} AND "depotId"=${depotId} AND "statut"=${EN_COURS}`;
      if (updated !== 1) throw new ConflictException('La tournée a changé d’état pendant le rapprochement.');
      return { id, caTheorique, montantEncaisseReel: total, ecartCaisse: ecart, ecartStock };
    });
  }

  async close(tenantId: string, depotId: string, id: string) {
    return this.serializable(async (tx) => {
      const rows = (await tx.$queryRaw`SELECT * FROM "TourneeWorkflow" WHERE id=${id} AND "tenantId"=${tenantId} AND "depotId"=${depotId} FOR UPDATE`) as Record<string, any>[];
      const workflow = rows[0];
      if (!workflow) throw new NotFoundException('Tournée introuvable.');
      if (workflow.statut !== EN_COURS) throw new ConflictException('La tournée doit être EN_COURS avant clôture.');
      if (!workflow.reconciledAt) throw new ConflictException('La réconciliation doit être enregistrée avant la clôture.');
      const lines = (await tx.$queryRaw`SELECT l.*, a."estConsigne" FROM "TourneeWorkflowLine" l JOIN "Article" a ON a.id=l."articleId" WHERE l."workflowId"=${id}`) as Record<string, any>[];
      if (!lines.length) throw new BadRequestException('Aucune ligne de chargement.');
      const unprocessed = lines.filter((line) => Number(line.quantiteRetourPleins) + Number(line.quantiteVendueTheorique) !== Number(line.quantiteChargee));
      if (unprocessed.length) throw new ConflictException('Enregistrez le retour de toutes les lignes avant la clôture.');
      let ecartStock = 0;
      for (const line of lines) {
        const retourPleins = Number(line.quantiteRetourPleins);
        const retourVides = Number(line.quantiteRetourVides);
        const vendue = Number(line.quantiteVendueTheorique);
        ecartStock += Number(line.quantiteChargee) - vendue - retourPleins;
        if (retourPleins > 0) {
          const stock = await tx.stock.findFirst({ where: { articleId: line.articleId, depotId }, select: { id: true } });
          if (stock) await tx.stock.update({ where: { id: stock.id }, data: { quantite: { increment: retourPleins } } });
          else await tx.stock.create({ data: { articleId: line.articleId, depotId, quantite: retourPleins } });
          await tx.mouvementStock.create({ data: { type: TypeMouvement.ENTREE, quantite: retourPleins, motif: `Réintégration retour tournée ${workflow.reference}`, articleId: line.articleId, depotId, tenantId, tourneeId: workflow.tourneeId } });
        }
        if (line.estConsigne && retourVides > 0) {
          await tx.$executeRaw`INSERT INTO "DepotConsigneStock" ("id","tenantId","depotId","articleId","quantite") VALUES (${randomUUID()},${tenantId},${depotId},${line.articleId},${retourVides}) ON CONFLICT ("depotId","articleId") DO UPDATE SET "quantite"="DepotConsigneStock"."quantite" + EXCLUDED."quantite", "updatedAt"=CURRENT_TIMESTAMP`;
        }
      }
      const ecart = Number(workflow.ecartCaisse);
      if (ecart < 0) {
        const reference = `DTC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID().slice(0, 8).toUpperCase()}`;
        await tx.$executeRaw`INSERT INTO "DetteCommerciale" ("id","reference","montant","commercialId","workflowId","tenantId","depotId") VALUES (${randomUUID()},${reference},${Math.abs(ecart)},${workflow.commercialId},${id},${tenantId},${depotId}) ON CONFLICT ("workflowId") DO NOTHING`;
      }
      const closed = await tx.$executeRaw`UPDATE "TourneeWorkflow" SET "statut"=${CLOTUREE}, "dateCloture"=CURRENT_TIMESTAMP, "immutable"=TRUE, "updatedAt"=CURRENT_TIMESTAMP WHERE id=${id} AND "tenantId"=${tenantId} AND "depotId"=${depotId} AND "statut"=${EN_COURS}`;
      if (closed !== 1) throw new ConflictException('La tournée a déjà été clôturée ou modifiée.');
      await tx.tournee.update({ where: { id: workflow.tourneeId }, data: { statut: 'CLOTURE_COMMERCIALE', dateCloture: new Date(), cashRemis: Number(workflow.cashReel), omRemis: Number(workflow.orangeMoneyReel), momoRemis: Number(workflow.mtnMomoReel), ecartStock } });
      const released = await tx.tricycle.updateMany({ where: { id: workflow.tricycleId, tenantId, depotId, estLibre: false }, data: { estLibre: true } });
      if (released.count !== 1) throw new ConflictException('Le tricycle ne peut pas être libéré : état inattendu.');
      return { id, statut: CLOTUREE, ecartCaisse: ecart, ecartStock };
    });
  }

  async stock(tenantId: string, depotId: string, articleId: string) {
    const article = await this.prisma.article.findFirst({ where: { id: articleId, tenantId }, select: { id: true, designation: true, prixVente: true, format: true, estConsigne: true } });
    if (!article) throw new NotFoundException('Article introuvable.');
    const stock = await this.prisma.stock.findFirst({ where: { articleId, depotId }, select: { quantite: true } });
    return { ...article, quantiteDisponible: stock?.quantite ?? 0 };
  }
}
