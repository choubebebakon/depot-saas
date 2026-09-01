import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma.service';
import { TypeMouvement } from '@prisma/client';

const PLANIFIEE = 'PLANIFIEE';
const EN_COURS = 'EN_COURS';
const CLOTUREE = 'CLOTUREE';

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

  async list(tenantId: string, depotId: string) {
    return this.prisma.$queryRaw<any[]>`
      SELECT w.*, json_build_object('id', t.id, 'nom', t.nom) AS tricycle,
        json_build_object('id', u.id, 'nom', u.nom, 'email', u.email) AS commercial,
        json_build_object('id', d.id, 'nom', d.nom) AS depot
      FROM "TourneeWorkflow" w
      JOIN "Tricycle" t ON t.id = w."tricycleId"
      JOIN "User" u ON u.id = w."commercialId"
      JOIN "Depot" d ON d.id = w."depotId"
      WHERE w."tenantId"=${tenantId} AND w."depotId"=${depotId}
      ORDER BY w."datePlanifiee" DESC`;
  }

  async get(tenantId: string, depotId: string, id: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT w.*, json_build_object('id', t.id, 'nom', t.nom) AS tricycle,
        json_build_object('id', u.id, 'nom', u.nom, 'email', u.email) AS commercial,
        json_build_object('id', d.id, 'nom', d.nom) AS depot,
        COALESCE((SELECT json_agg(json_build_object(
          'id', l.id, 'articleId', l."articleId", 'designation', a.designation, 'format', a.format,
          'estConsigne', a."estConsigne", 'quantiteChargee', l."quantiteChargee",
          'prixUnitaireFacture', l."prixUnitaireFacture", 'quantiteRetourPleins', l."quantiteRetourPleins",
          'quantiteRetourVides', l."quantiteRetourVides", 'quantiteVendueTheorique', l."quantiteVendueTheorique",
          'caTheorique', l."caTheorique"
        ) ORDER BY a.designation) FROM "TourneeWorkflowLine" l JOIN "Article" a ON a.id=l."articleId" WHERE l."workflowId"=w.id), '[]'::json) AS lignes,
        (SELECT json_build_object('id', dc.id, 'reference', dc.reference, 'montant', dc.montant, 'montantPaye', dc."montantPaye", 'statut', dc.statut)
          FROM "DetteCommerciale" dc WHERE dc."workflowId"=w.id) AS dette,
        COALESCE((SELECT json_agg(json_build_object('articleId', cs."articleId", 'quantite', cs.quantite))
          FROM "DepotConsigneStock" cs WHERE cs."tenantId"=w."tenantId" AND cs."depotId"=w."depotId"), '[]'::json) AS stockConsignes
      FROM "TourneeWorkflow" w
      JOIN "Tricycle" t ON t.id=w."tricycleId" JOIN "User" u ON u.id=w."commercialId" JOIN "Depot" d ON d.id=w."depotId"
      WHERE w.id=${id} AND w."tenantId"=${tenantId} AND w."depotId"=${depotId} LIMIT 1`;
    if (!rows[0]) throw new NotFoundException('Tournée introuvable dans le dépôt actif.');
    return rows[0];
  }

  async create(tenantId: string, depotId: string, data: any) {
    if (!data?.tricycleId || !data?.commercialId) throw new BadRequestException('Tricycle et commercial sont obligatoires.');
    const date = data.date ? new Date(data.date) : new Date();
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Date de tournée invalide.');
    return this.prisma.$transaction(async (tx) => {
      const [tricycle, commercial, depot] = await Promise.all([
        tx.tricycle.findFirst({ where: { id: data.tricycleId, tenantId, depotId }, select: { id: true, nom: true, estLibre: true } }),
        tx.user.findFirst({ where: { id: data.commercialId, tenantId, depotId, role: 'COMMERCIAL' }, select: { id: true, nom: true, email: true } }),
        tx.depot.findFirst({ where: { id: depotId, tenantId }, select: { id: true } }),
      ]);
      if (!depot) throw new NotFoundException('Dépôt actif introuvable.');
      if (!tricycle) throw new NotFoundException('Tricycle introuvable dans ce dépôt.');
      if (!tricycle.estLibre) throw new ConflictException('Ce tricycle est déjà affecté à une tournée.');
      if (!commercial) throw new NotFoundException('Commercial introuvable dans ce dépôt.');
      const reference = `TRN-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${randomUUID().slice(0,8).toUpperCase()}`;
      const tournee = await tx.tournee.create({ data: { reference, statut: 'OUVERTE', dateOuverture: date, depotId, tricycleId: data.tricycleId, commercialId: data.commercialId, tenantId }, select: { id: true } });
      await tx.tricycle.update({ where: { id: tricycle.id }, data: { estLibre: false } });
      const id = randomUUID();
      await tx.$executeRaw`INSERT INTO "TourneeWorkflow" ("id","reference","statut","tenantId","depotId","tricycleId","commercialId","tourneeId","datePlanifiee") VALUES (${id},${reference},${PLANIFIEE},${tenantId},${depotId},${data.tricycleId},${data.commercialId},${tournee.id},${date})`;
      return this.get(tenantId, depotId, id);
    });
  }

  async update(tenantId: string, depotId: string, id: string, data: any) {
    const current = await this.get(tenantId, depotId, id);
    if (current.statut !== PLANIFIEE) throw new ConflictException('Une tournée démarrée ou clôturée ne peut plus être modifiée.');
    if (!data?.tricycleId || !data?.commercialId) throw new BadRequestException('Tricycle et commercial obligatoires.');
    const date = new Date(data.date);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Date invalide.');
    return this.prisma.$transaction(async (tx) => {
      const [oldTricycle, newTricycle, commercial] = await Promise.all([
        tx.tricycle.findFirst({ where: { id: current.tricycleId, tenantId, depotId } }),
        tx.tricycle.findFirst({ where: { id: data.tricycleId, tenantId, depotId } }),
        tx.user.findFirst({ where: { id: data.commercialId, tenantId, depotId, role: 'COMMERCIAL' } }),
      ]);
      if (!newTricycle) throw new NotFoundException('Nouveau tricycle introuvable.');
      if (!commercial) throw new NotFoundException('Commercial introuvable.');
      if (newTricycle.id !== current.tricycleId && !newTricycle.estLibre) throw new ConflictException('Le nouveau tricycle est déjà affecté.');
      await tx.tournee.update({ where: { id: current.tourneeId }, data: { tricycleId: data.tricycleId, commercialId: data.commercialId, dateOuverture: date } });
      if (oldTricycle && oldTricycle.id !== newTricycle.id) await tx.tricycle.update({ where: { id: oldTricycle.id }, data: { estLibre: true } });
      await tx.tricycle.update({ where: { id: newTricycle.id }, data: { estLibre: false } });
      await tx.$executeRaw`UPDATE "TourneeWorkflow" SET "tricycleId"=${data.tricycleId}, "commercialId"=${data.commercialId}, "datePlanifiee"=${date}, "updatedAt"=CURRENT_TIMESTAMP WHERE id=${id} AND "tenantId"=${tenantId} AND "depotId"=${depotId}`;
      return this.get(tenantId, depotId, id);
    });
  }

  async addLine(tenantId: string, depotId: string, id: string, data: any) {
    this.assertPositiveInt(data?.quantiteChargee, 'Quantité chargée');
    const current = await this.get(tenantId, depotId, id);
    if (current.statut !== PLANIFIEE) throw new ConflictException('Le chargement est verrouillé après le départ.');
    const article = await this.prisma.article.findFirst({ where: { id: data.articleId, tenantId }, select: { id: true, designation: true, prixVente: true } });
    if (!article) throw new NotFoundException('Article introuvable.');
    const stock = await this.prisma.stock.findFirst({ where: { articleId: article.id, depotId }, select: { quantite: true } });
    if (!stock || stock.quantite < data.quantiteChargee) throw new ConflictException(`Stock insuffisant pour ${article.designation}. Disponible : ${stock?.quantite ?? 0}.`);
    const price = data.prixUnitaireFacture ?? article.prixVente;
    this.assertMoney(price, 'Prix unitaire');
    const lineId = randomUUID();
    await this.prisma.$executeRaw`INSERT INTO "TourneeWorkflowLine" ("id","workflowId","articleId","quantiteChargee","prixUnitaireFacture") VALUES (${lineId},${id},${article.id},${data.quantiteChargee},${price})`;
    return this.get(tenantId, depotId, id);
  }

  async removeLine(tenantId: string, depotId: string, id: string, lineId: string) {
    const current = await this.get(tenantId, depotId, id);
    if (current.statut !== PLANIFIEE) throw new ConflictException('Le chargement est verrouillé après le départ.');
    const result = await this.prisma.$executeRaw`DELETE FROM "TourneeWorkflowLine" WHERE id=${lineId} AND "workflowId"=${id}`;
    if (result !== 1) throw new NotFoundException('Ligne de chargement introuvable.');
    return this.get(tenantId, depotId, id);
  }

  async depart(tenantId: string, depotId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<any[]>`SELECT * FROM "TourneeWorkflow" WHERE id=${id} AND "tenantId"=${tenantId} AND "depotId"=${depotId} FOR UPDATE`;
      const workflow = rows[0];
      if (!workflow) throw new NotFoundException('Tournée introuvable.');
      if (workflow.statut !== PLANIFIEE) throw new ConflictException('Cette tournée n’est plus planifiable.');
      const lines = await tx.$queryRaw<any[]>`SELECT * FROM "TourneeWorkflowLine" WHERE "workflowId"=${id}`;
      if (!lines.length) throw new BadRequestException('Ajoutez au moins un article avant de valider le départ.');
      let totalQty = 0; let totalValue = 0;
      for (const line of lines) {
        const article = await tx.article.findFirst({ where: { id: line.articleId, tenantId }, select: { designation: true } });
        if (!article) throw new NotFoundException('Article de chargement introuvable.');
        const result = await tx.stock.updateMany({ where: { articleId: line.articleId, depotId, quantite: { gte: Number(line.quantiteChargee) } }, data: { quantite: { decrement: Number(line.quantiteChargee) } });
        if (result.count !== 1) throw new ConflictException(`Stock insuffisant ou modifié simultanément pour ${article.designation}.`);
        await tx.mouvementStock.create({ data: { type: TypeMouvement.SORTIE, quantite: Number(line.quantiteChargee), motif: `Chargement tournée ${workflow.reference}`, articleId: line.articleId, depotId, tenantId, tourneeId: workflow.tourneeId } });
        await tx.ligneChargement.create({ data: { quantiteChargee: Number(line.quantiteChargee), articleId: line.articleId, tourneeId: workflow.tourneeId } });
        totalQty += Number(line.quantiteChargee); totalValue += Number(line.quantiteChargee) * Number(line.prixUnitaireFacture);
      }
      await tx.$executeRaw`UPDATE "TourneeWorkflow" SET "statut"=${EN_COURS}, "dateDepart"=CURRENT_TIMESTAMP, "totalQuantiteChargee"=${totalQty}, "totalValeurChargee"=${totalValue}, "updatedAt"=CURRENT_TIMESTAMP WHERE id=${id} AND "statut"=${PLANIFIEE}`;
      await tx.tournee.update({ where: { id: workflow.tourneeId }, data: { statut: 'OUVERTE', dateOuverture: new Date() } });
      return this.get(tenantId, depotId, id);
    }, { isolationLevel: 'Serializable' });
  }

  async reconcile(tenantId: string, depotId: string, id: string, data: any) {
    const current = await this.get(tenantId, depotId, id);
    if (current.statut !== EN_COURS) throw new ConflictException('La tournée doit être en cours pour enregistrer le retour.');
    if (!Array.isArray(data?.lignes)) throw new BadRequestException('Les lignes de retour sont obligatoires.');
    this.assertMoney(data.cashReel ?? 0, 'Cash réel'); this.assertMoney(data.orangeMoneyReel ?? 0, 'Orange Money réel'); this.assertMoney(data.mtnMomoReel ?? 0, 'MTN MoMo réel');
    return this.prisma.$transaction(async (tx) => {
      const workflowRows = await tx.$queryRaw<any[]>`SELECT * FROM "TourneeWorkflow" WHERE id=${id} AND "tenantId"=${tenantId} AND "depotId"=${depotId} FOR UPDATE`;
      const workflow = workflowRows[0];
      if (!workflow || workflow.statut !== EN_COURS) throw new ConflictException('État de tournée invalide.');
      const dbLines = await tx.$queryRaw<any[]>`SELECT l.*, a."estConsigne" FROM "TourneeWorkflowLine" l JOIN "Article" a ON a.id=l."articleId" WHERE l."workflowId"=${id}`;
      if (data.lignes.length !== dbLines.length) throw new BadRequestException('Toutes les lignes chargées doivent être renseignées une seule fois.');
      const byId = new Map(dbLines.map((line) => [line.id, line]));
      const seen = new Set<string>(); let caTheorique = 0;
      for (const input of data.lignes) {
        if (seen.has(input.lineId)) throw new BadRequestException('Une ligne de retour est renseignée plusieurs fois.');
        seen.add(input.lineId);
        const line = byId.get(input.lineId);
        if (!line) throw new BadRequestException('Une ligne de retour est invalide.');
        this.assertNonNegativeInt(input.quantiteRetourPleins, 'Retour pleins'); this.assertNonNegativeInt(input.quantiteRetourVides, 'Retour vides');
        const retourPleins = Number(input.quantiteRetourPleins); const retourVides = Number(input.quantiteRetourVides); const chargee = Number(line.quantiteChargee);
        if (retourPleins > chargee) throw new BadRequestException('Le retour plein ne peut pas dépasser la quantité chargée.');
        const vendue = chargee - retourPleins;
        if (line.estConsigne && retourVides > vendue) throw new BadRequestException('Le retour de vides ne peut pas dépasser la quantité vendue théorique.');
        const ca = vendue * Number(line.prixUnitaireFacture); caTheorique += ca;
        await tx.$executeRaw`UPDATE "TourneeWorkflowLine" SET "quantiteRetourPleins"=${retourPleins}, "quantiteRetourVides"=${retourVides}, "quantiteVendueTheorique"=${vendue}, "caTheorique"=${ca} WHERE id=${line.id}`;
      }
      const cash = Number(data.cashReel ?? 0); const om = Number(data.orangeMoneyReel ?? 0); const momo = Number(data.mtnMomoReel ?? 0); const total = cash + om + momo; const ecart = total - caTheorique;
      await tx.$executeRaw`UPDATE "TourneeWorkflow" SET "cashReel"=${cash}, "orangeMoneyReel"=${om}, "mtnMomoReel"=${momo}, "montantEncaisseReel"=${total}, "caTheorique"=${caTheorique}, "ecartCaisse"=${ecart}, "updatedAt"=CURRENT_TIMESTAMP WHERE id=${id} AND "statut"=${EN_COURS}`;
      return this.get(tenantId, depotId, id);
    });
  }

  async close(tenantId: string, depotId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<any[]>`SELECT * FROM "TourneeWorkflow" WHERE id=${id} AND "tenantId"=${tenantId} AND "depotId"=${depotId} FOR UPDATE`;
      const workflow = rows[0];
      if (!workflow) throw new NotFoundException('Tournée introuvable.');
      if (workflow.statut !== EN_COURS) throw new ConflictException('La tournée doit être EN_COURS avant clôture.');
      const lines = await tx.$queryRaw<any[]>`SELECT l.*, a."estConsigne" FROM "TourneeWorkflowLine" l JOIN "Article" a ON a.id=l."articleId"`;
      const tourLines = lines.filter((line) => true);
      const scoped = tourLines.filter((line) => true);
      const workflowLines = await tx.$queryRaw<any[]>`SELECT l.*, a."estConsigne" FROM "TourneeWorkflowLine" l JOIN "Article" a ON a.id=l."articleId" WHERE l."workflowId"=${id}`;
      if (!workflowLines.length) throw new BadRequestException('Aucune ligne de chargement.');
      const unprocessed = workflowLines.filter((line) => Number(line.quantiteRetourPleins) + Number(line.quantiteVendueTheorique) !== Number(line.quantiteChargee));
      if (unprocessed.length) throw new ConflictException('Enregistrez le retour de toutes les lignes avant la clôture.');

      for (const line of workflowLines) {
        const retourPleins = Number(line.quantiteRetourPleins); const retourVides = Number(line.quantiteRetourVides);
        if (retourPleins > 0) {
          const stock = await tx.stock.findFirst({ where: { articleId: line.articleId, depotId }, select: { id: true } });
          if (stock) await tx.stock.update({ where: { id: stock.id }, data: { quantite: { increment: retourPleins } } });
          else await tx.stock.create({ data: { articleId: line.articleId, depotId, quantite: retourPleins } });
          await tx.mouvementStock.create({ data: { type: TypeMouvement.ENTREE, quantite: retourPleins, motif: `Réintégration retour tournée ${workflow.reference}`, articleId: line.articleId, depotId, tenantId, tourneeId: workflow.tourneeId } });
        }
        if (line.estConsigne && retourVides > 0) {
          await tx.$executeRaw`
            INSERT INTO "DepotConsigneStock" ("id","tenantId","depotId","articleId","quantite") VALUES (${randomUUID()},${tenantId},${depotId},${line.articleId},${retourVides})
            ON CONFLICT ("depotId","articleId") DO UPDATE SET "quantite"="DepotConsigneStock"."quantite" + EXCLUDED."quantite", "updatedAt"=CURRENT_TIMESTAMP`;
          }
      }

      const ecart = Number(workflow.ecartCaisse);
      if (ecart < 0) {
        const reference = `DTC-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${randomUUID().slice(0,8).toUpperCase()}`;
        await tx.$executeRaw`INSERT INTO "DetteCommerciale" ("id","reference","montant","commercialId","workflowId","tenantId","depotId") VALUES (${randomUUID()},${reference},${Math.abs(ecart)},${workflow.commercialId},${id},${tenantId},${depotId}) ON CONFLICT ("workflowId") DO NOTHING`;
      }
      const closed = await tx.$executeRaw`UPDATE "TourneeWorkflow" SET "statut"=${CLOTUREE}, "dateCloture"=CURRENT_TIMESTAMP, "immutable"=TRUE, "updatedAt"=CURRENT_TIMESTAMP WHERE id=${id} AND "tenantId"=${tenantId} AND "depotId"=${depotId} AND "statut"=${EN_COURS}`;
      if (closed !== 1) throw new ConflictException('La tournée a déjà été clôturée ou modifiée.');
      await tx.tournee.update({ where: { id: workflow.tourneeId }, data: { statut: 'CLOTURE_COMMERCIALE', dateCloture: new Date(), cashRemis: Number(workflow.cashReel), omRemis: Number(workflow.orangeMoneyReel), momoRemis: Number(workflow.mtnMomoReel), ecartStock: Number(workflow.ecartCaisse) } });
      await tx.tricycle.update({ where: { id: workflow.tricycleId }, data: { estLibre: true } });
      return this.get(tenantId, depotId, id);
    }, { isolationLevel: 'Serializable' });
  }

  async stock(tenantId: string, depotId: string, articleId: string) {
    const article = await this.prisma.article.findFirst({ where: { id: articleId, tenantId }, select: { id: true, designation: true, prixVente: true, format: true, estConsigne: true } });
    if (!article) throw new NotFoundException('Article introuvable.');
    const stock = await this.prisma.stock.findFirst({ where: { articleId, depotId }, select: { quantite: true } });
    return { ...article, quantiteDisponible: stock?.quantite ?? 0 };
  }
}
