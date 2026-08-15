import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  @MaxLength(500)
  message: string;

  @IsString()
  @IsOptional()
  contexte?: string;
}

export class ChatResponseDto {
  reponse: string;
  donnees?: any;
  suggestions: string[];
}

interface TenantContext {
  tenantId: string;
  metier: string;
  nomTenant: string;
}

@Injectable()
export class ChatbotService {
  private readonly GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  constructor(private readonly prisma: PrismaService) {}

  async chat(
    ctx: TenantContext,
    dto: ChatMessageDto,
  ): Promise<ChatResponseDto> {
    const message = dto.message.trim().toLowerCase();

    const donnees = await this.getDonneesContextuelles(ctx, message);
    const prompt = this.buildPrompt(ctx, dto.message, donnees);
    const reponseIA = await this.callGemini(prompt);
    const suggestions = this.getSuggestions(ctx.metier, message);

    return { reponse: reponseIA, donnees, suggestions };
  }

  private async getDonneesContextuelles(
    ctx: TenantContext,
    message: string,
  ): Promise<any> {
    const { tenantId } = ctx;
    const aujourd_hui = new Date();
    aujourd_hui.setHours(0, 0, 0, 0);

    if (
      this.contient(message, [
        'stock',
        'rupture',
        'manque',
        'quantité',
        'reste',
        'épuisé',
      ])
    ) {
      const stocks = await this.prisma.stock.findMany({
        where: { depot: { tenantId } },
        include: {
          article: {
            select: { designation: true, seuilCritique: true, prixVente: true },
          },
          depot: { select: { nom: true } },
        },
      });

      const enRupture = stocks.filter(
        (s) => s.quantite <= (s.seuilCritique ?? s.article.seuilCritique ?? 0),
      );

      return {
        type: 'STOCK_CRITIQUE',
        total: enRupture.length,
        articles: enRupture.slice(0, 10).map((s) => ({
          nom: s.article.designation,
          quantite: s.quantite,
          seuil: s.seuilCritique ?? s.article.seuilCritique,
          depot: s.depot.nom,
        })),
      };
    }

    if (
      this.contient(message, [
        'vente',
        'ventes',
        'vendu',
        'chiffre',
        'recette',
        'aujourd',
      ])
    ) {
      const [ventesJour, totalJour] = await Promise.all([
        this.prisma.vente.findMany({
          where: { tenantId, date: { gte: aujourd_hui }, statut: 'PAYE' },
          include: {
            lignes: { include: { article: { select: { designation: true } } } },
          },
          orderBy: { date: 'desc' },
          take: 20,
        }),
        this.prisma.vente.aggregate({
          where: { tenantId, date: { gte: aujourd_hui }, statut: 'PAYE' },
          _sum: { total: true },
          _count: true,
        }),
      ]);

      const articlesCount: Record<string, number> = {};
      ventesJour.forEach((v) =>
        v.lignes.forEach((l) => {
          const nom = l.article.designation;
          articlesCount[nom] = (articlesCount[nom] || 0) + l.quantite;
        }),
      );
      const topArticles = Object.entries(articlesCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([nom, qte]) => ({ nom, quantite: qte }));

      return {
        type: 'VENTES_JOUR',
        totalVentes: totalJour._sum.total ?? 0,
        nbTransactions: totalJour._count,
        topArticles,
      };
    }

    if (
      this.contient(message, [
        'client',
        'clients',
        'fidèle',
        'fideles',
        'meilleur',
      ])
    ) {
      const [totalClients, topClients] = await Promise.all([
        this.prisma.client.count({ where: { tenantId } }),
        this.prisma.client.findMany({
          where: { tenantId },
          include: { _count: { select: { ventes: true } } },
          orderBy: { ventes: { _count: 'desc' } },
          take: 5,
        }),
      ]);

      return {
        type: 'CLIENTS',
        totalClients,
        topClients: topClients.map((c) => ({
          nom: c.nom,
          telephone: c.telephone,
          nbAchats: c._count.ventes,
        })),
      };
    }

    if (
      this.contient(message, [
        'caisse',
        'argent',
        'fond',
        'solde',
        'encaissement',
      ])
    ) {
      const session = await this.prisma.sessionCaisse.findFirst({
        where: { tenantId, estOuverte: true },
        include: { mouvements: { orderBy: { createdAt: 'desc' }, take: 5 } },
        orderBy: { dateOuverture: 'desc' },
      });

      const totalEncaisse =
        session?.mouvements
          .filter((m) => m.type === 'ENCAISSEMENT_VENTE')
          .reduce((sum, m) => sum + m.montant, 0) ?? 0;

      return {
        type: 'CAISSE',
        sessionOuverte: !!session,
        fondInitial: session?.fondInitial ?? 0,
        totalEncaisse,
        derniersMouvements: session?.mouvements.slice(0, 3) ?? [],
      };
    }

    if (
      this.contient(message, [
        'fournisseur',
        'fournisseurs',
        'commande',
        'livraison',
      ])
    ) {
      const fournisseurs = await this.prisma.fournisseur.findMany({
        where: { tenantId },
        include: { _count: { select: { commandes: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      return {
        type: 'FOURNISSEURS',
        total: fournisseurs.length,
        liste: fournisseurs.map((f) => ({
          nom: f.nom,
          telephone: f.telephone,
          solde: f.solde,
          nbCommandes: f._count.commandes,
        })),
      };
    }

    if (
      ctx.metier === 'PHARMACIE' &&
      this.contient(message, ['expir', 'dlc', 'périm', 'date limite', 'lot'])
    ) {
      const dans30jours = new Date();
      dans30jours.setDate(dans30jours.getDate() + 30);

      const alertes = await this.prisma.medicament.findMany({
        where: {
          tenantId,
          dateExpiration: { gte: new Date(), lte: dans30jours },
        },
        include: { article: { select: { designation: true } } },
        orderBy: { dateExpiration: 'asc' },
        take: 10,
      });

      return {
        type: 'ALERTES_DLC',
        total: alertes.length,
        medicaments: alertes.map((m) => ({
          nom: m.article.designation,
          expiration: m.dateExpiration,
          joursRestants: Math.ceil(
            (new Date(m.dateExpiration).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24),
          ),
        })),
      };
    }

    if (
      ctx.metier === 'HOTEL' &&
      this.contient(message, [
        'chambre',
        'libre',
        'disponible',
        'occupée',
        'réservation',
      ])
    ) {
      const [libres, occupees, total] = await Promise.all([
        this.prisma.chambre.count({ where: { tenantId, statut: 'LIBRE' } }),
        this.prisma.chambre.count({ where: { tenantId, statut: 'OCCUPEE' } }),
        this.prisma.chambre.count({ where: { tenantId } }),
      ]);

      return {
        type: 'CHAMBRES',
        total,
        libres,
        occupees,
        tauxOccupation: total > 0 ? Math.round((occupees / total) * 100) : 0,
      };
    }

    if (
      ctx.metier === 'RESTAURANT' &&
      this.contient(message, ['table', 'couvert', 'commande', 'cuisine'])
    ) {
      const [libres, occupees, commandesEnCours] = await Promise.all([
        this.prisma.table.count({ where: { tenantId, statut: 'LIBRE' } }),
        this.prisma.table.count({ where: { tenantId, statut: 'OCCUPEE' } }),
        this.prisma.commande.count({
          where: { tenantId, statut: { in: ['EN_ATTENTE', 'EN_PREPARATION'] } },
        }),
      ]);

      return { type: 'TABLES_RESTO', libres, occupees, commandesEnCours };
    }

    if (
      this.contient(message, [
        'stat',
        'résumé',
        'bilan',
        'rapport',
        'performance',
      ])
    ) {
      const debutMois = new Date();
      debutMois.setDate(1);
      debutMois.setHours(0, 0, 0, 0);

      const [ventesJour, ventesMois, nbClients, stockCritique] =
        await Promise.all([
          this.prisma.vente.aggregate({
            where: { tenantId, date: { gte: aujourd_hui }, statut: 'PAYE' },
            _sum: { total: true },
            _count: true,
          }),
          this.prisma.vente.aggregate({
            where: { tenantId, date: { gte: debutMois }, statut: 'PAYE' },
            _sum: { total: true },
            _count: true,
          }),
          this.prisma.client.count({ where: { tenantId } }),
          this.prisma.stock.count({
            where: { depot: { tenantId }, quantite: { lte: 5 } },
          }),
        ]);

      return {
        type: 'STATS_GENERALES',
        ventesJour: ventesJour._sum.total ?? 0,
        nbVentesJour: ventesJour._count,
        ventesMois: ventesMois._sum.total ?? 0,
        nbVentesMois: ventesMois._count,
        totalClients: nbClients,
        stocksCritiques: stockCritique,
      };
    }

    // Prévision des ventes
    if (
      this.contient(message, [
        'prévoir',
        'prévision',
        'tendance',
        'anticiper',
        'futur',
        'prédire',
      ])
    ) {
      const debutMois = new Date();
      debutMois.setDate(1);
      debutMois.setHours(0, 0, 0, 0);

      const ventesMois = await this.prisma.vente.aggregate({
        where: { tenantId, date: { gte: debutMois }, statut: 'PAYE' },
        _sum: { total: true },
        _count: true,
      });

      const ventesParJour = await this.prisma.vente.groupBy({
        by: ['date'],
        where: { tenantId, date: { gte: debutMois }, statut: 'PAYE' },
        _sum: { total: true },
        orderBy: { date: 'asc' },
      });

      const moyenneJournaliere = ventesMois._count > 0 && ventesMois._sum.total
        ? ventesMois._sum.total / ventesMois._count 
        : 0;

      const joursRestantsMois = new Date(debutMois.getFullYear(), debutMois.getMonth() + 1, 0).getDate() - aujourd_hui.getDate();
      const previsionFinMois = moyenneJournaliere * joursRestantsMois;

      return {
        type: 'PREVISION_VENTES',
        moyenneJournaliere,
        totalMoisActuel: ventesMois._sum.total ?? 0,
        previsionFinMois,
        joursRestants: joursRestantsMois,
        tendance: ventesParJour.length > 5 ? 'croissante' : 'stable',
      };
    }

    // Détection des anomalies
    if (
      this.contient(message, [
        'anomalie',
        'écart',
        'perte',
        'incohérence',
        'anormal',
        'suspect',
      ])
    ) {
      const debutMois = new Date();
      debutMois.setDate(1);
      debutMois.setHours(0, 0, 0, 0);

      const [ventesMois, stocks, depenses] = await Promise.all([
        this.prisma.vente.aggregate({
          where: { tenantId, date: { gte: debutMois }, statut: 'PAYE' },
          _sum: { total: true },
        }),
        this.prisma.stock.findMany({
          where: { depot: { tenantId } },
          include: { article: { select: { designation: true, prixAchat: true, prixVente: true } } },
        }),
        this.prisma.depense.aggregate({
          where: { tenantId, createdAt: { gte: debutMois } },
          _sum: { montant: true },
        }),
      ]);

      const anomalies: any[] = [];
      
      // Détection de marges anormales
      stocks.forEach(s => {
        const marge = (s.article.prixVente - s.article.prixAchat) / s.article.prixAchat * 100;
        if (marge < 10) {
          anomalies.push({
            type: 'MARGE_FAIBLE',
            produit: s.article.designation,
            marge: marge.toFixed(2) + '%',
          });
        }
      });

      // Détection de ratio dépenses/ventes anormal
      const ratioDepenses = ventesMois._sum.total && ventesMois._sum.total > 0 
        ? ((depenses._sum?.montant ?? 0) / ventesMois._sum.total) * 100 
        : 0;
      
      if (ratioDepenses > 50) {
        anomalies.push({
          type: 'DEPENSES_ELEVEES',
          ratio: ratioDepenses.toFixed(2) + '%',
        });
      }

      return {
        type: 'DETECTION_ANOMALIES',
        totalAnomalies: anomalies.length,
        anomalies: anomalies.slice(0, 10),
        ratioDepenses,
      };
    }

    // Recommandations de réapprovisionnement
    if (
      this.contient(message, [
        'réapprovisionnement',
        'recommander',
        'commander',
        'réapprovisionner',
        'restock',
      ])
    ) {
      const stocks = await this.prisma.stock.findMany({
        where: { depot: { tenantId } },
        include: { 
          article: { 
            select: { 
              designation: true, 
              seuilCritique: true,
              prixAchat: true 
            } 
          } 
        },
      });

      const recommandations = stocks
        .filter(s => s.quantite <= (s.seuilCritique ?? s.article.seuilCritique ?? 10))
        .map(s => ({
          produit: s.article.designation,
          quantiteActuelle: s.quantite,
          seuilCritique: s.seuilCritique ?? s.article.seuilCritique ?? 10,
          quantiteSuggeree: Math.max((s.seuilCritique ?? s.article.seuilCritique ?? 10) * 3, 50),
          priorite: s.quantite === 0 ? 'URGENT' : s.quantite < 5 ? 'HAUTE' : 'MOYENNE',
          estimationCout: Math.max((s.seuilCritique ?? s.article.seuilCritique ?? 10) * 3, 50) * s.article.prixAchat,
        }))
        .sort((a, b) => {
          const prioriteOrder = { 'URGENT': 0, 'HAUTE': 1, 'MOYENNE': 2 };
          return prioriteOrder[a.priorite] - prioriteOrder[b.priorite];
        })
        .slice(0, 15);

      return {
        type: 'RECOMMANDATIONS_REAPPROVISIONNEMENT',
        totalRecommandations: recommandations.length,
        recommandations,
        estimationCoutTotal: recommandations.reduce((sum, r) => sum + r.estimationCout, 0),
      };
    }

    // Identification des produits rentables
    if (
      this.contient(message, [
        'rentable',
        'rentabilité',
        'marge',
        'profit',
        'bénéfice',
        'performant',
      ])
    ) {
      const debutMois = new Date();
      debutMois.setDate(1);
      debutMois.setHours(0, 0, 0, 0);

      const ventes = await this.prisma.vente.findMany({
        where: { tenantId, date: { gte: debutMois }, statut: 'PAYE' },
        include: {
          lignes: {
            include: {
              article: {
                select: { 
                  designation: true, 
                  prixAchat: true, 
                  prixVente: true 
                } 
              } 
            } 
          },
        },
      });

      const rentabiliteParProduit: Record<string, { 
        ventes: number; 
        quantite: number; 
        margeTotale: number; 
        prixAchat: number; 
        prixVente: number; 
      }> = {};

      ventes.forEach(v => {
        v.lignes.forEach(l => {
          const nom = l.article.designation;
          const marge = (l.article.prixVente - l.article.prixAchat) * l.quantite;
          
          if (!rentabiliteParProduit[nom]) {
            rentabiliteParProduit[nom] = {
              ventes: 0,
              quantite: 0,
              margeTotale: 0,
              prixAchat: l.article.prixAchat,
              prixVente: l.article.prixVente,
            };
          }
          
          rentabiliteParProduit[nom].ventes += l.prix * l.quantite;
          rentabiliteParProduit[nom].quantite += l.quantite;
          rentabiliteParProduit[nom].margeTotale += marge;
        });
      });

      const produitsRentables = Object.entries(rentabiliteParProduit)
        .map(([nom, data]) => ({
          produit: nom,
          ventes: data.ventes,
          quantite: data.quantite,
          margeTotale: data.margeTotale,
          margeUnitaire: data.prixVente - data.prixAchat,
          tauxMarge: ((data.prixVente - data.prixAchat) / data.prixAchat * 100).toFixed(2) + '%',
        }))
        .sort((a, b) => b.margeTotale - a.margeTotale)
        .slice(0, 10);

      return {
        type: 'PRODUITS_RENTABLES',
        totalProduits: produitsRentables.length,
        produits: produitsRentables,
      };
    }

    // Création automatique de rapports
    if (
      this.contient(message, [
        'rapport automatique',
        'générer rapport',
        'résumé automatique',
        'bilan automatique',
      ])
    ) {
      const debutMois = new Date();
      debutMois.setDate(1);
      debutMois.setHours(0, 0, 0, 0);

      const [ventesMois, ventesPrecedent, stockCritique, topClients] = await Promise.all([
        this.prisma.vente.aggregate({
          where: { tenantId, date: { gte: debutMois }, statut: 'PAYE' },
          _sum: { total: true },
          _count: true,
        }),
        this.prisma.vente.aggregate({
          where: { 
            tenantId, 
            date: { 
              gte: new Date(debutMois.getFullYear(), debutMois.getMonth() - 1, 1),
              lt: debutMois 
            }, 
            statut: 'PAYE' 
          },
          _sum: { total: true },
        }),
        this.prisma.stock.count({
          where: { depot: { tenantId }, quantite: { lte: 5 } },
        }),
        this.prisma.client.findMany({
          where: { tenantId },
          include: { _count: { select: { ventes: true } } },
          orderBy: { ventes: { _count: 'desc' } },
          take: 5,
        }),
      ]);

      const evolution = ventesPrecedent._sum.total && ventesPrecedent._sum.total > 0 && ventesMois._sum.total
        ? ((ventesMois._sum.total - ventesPrecedent._sum.total) / ventesPrecedent._sum.total * 100).toFixed(2) + '%'
        : 'N/A';

      return {
        type: 'RAPPORT_AUTOMATIQUE',
        periode: debutMois.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        ventesMois: ventesMois._sum.total ?? 0,
        nbVentes: ventesMois._count,
        evolutionMoisPrecedent: evolution,
        stockCritique,
        topClients: topClients.map(c => ({ nom: c.nom, nbAchats: c._count.ventes })),
        recommandations: stockCritique > 0 
          ? 'Attention : plusieurs produits en stock critique. Vérifiez les réapprovisionnements.'
          : 'Stock stable. Continuez à surveiller les ventes.',
      };
    }

    // Anticipation des périodes de forte activité
    if (
      this.contient(message, [
        'période forte activité',
        'pic',
        'saison',
        'forte demande',
        'pointe',
      ])
    ) {
      const ventesParMois = await this.prisma.vente.groupBy({
        by: ['date'],
        where: { tenantId, statut: 'PAYE' },
        _sum: { total: true },
        orderBy: { date: 'desc' },
        take: 90,
      });

      const ventesParJourSemaine: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      
      ventesParMois.forEach(v => {
        const jour = new Date(v.date).getDay();
        ventesParJourSemaine[jour] += v._sum.total ?? 0;
      });

      const joursNoms = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const jourPlusActif = Object.entries(ventesParJourSemaine)
        .sort((a, b) => b[1] - a[1])[0];

      return {
        type: 'ANTICIPATION_PICS',
        jourPlusActif: joursNoms[parseInt(jourPlusActif[0])],
        moyenneJourPlusActif: jourPlusActif[1],
        distributionParJour: Object.entries(ventesParJourSemaine).map(([jour, total]) => ({
          jour: joursNoms[parseInt(jour)],
          total,
        })),
        recommandation: 'Planifiez vos stocks et personnel en conséquence pour maximiser les ventes.',
      };
    }

    // Optimisation des promotions
    if (
      this.contient(message, [
        'promotion',
        'réduction',
        'offre',
        'optimiser promotion',
      ])
    ) {
      const debutMois = new Date();
      debutMois.setDate(1);
      debutMois.setHours(0, 0, 0, 0);

      const [ventes, stocksLents] = await Promise.all([
        this.prisma.vente.findMany({
          where: { tenantId, date: { gte: debutMois }, statut: 'PAYE' },
          include: {
            lignes: {
              include: {
                article: { select: { designation: true, prixVente: true } }
              }
            }
          },
        }),
        this.prisma.stock.findMany({
          where: { 
            depot: { tenantId },
            quantite: { gt: 20 }
          },
          include: { 
            article: { 
              select: { designation: true, prixVente: true, prixAchat: true } 
            } 
          },
        }),
      ]);

      const ventesParProduit: Record<string, number> = {};
      ventes.forEach(v => {
        v.lignes.forEach(l => {
          ventesParProduit[l.article.designation] = (ventesParProduit[l.article.designation] || 0) + l.quantite;
        });
      });

      const produitsLents = stocksLents
        .filter(s => (ventesParProduit[s.article.designation] || 0) < 5)
        .map(s => ({
          produit: s.article.designation,
          stock: s.quantite,
          ventesMois: ventesParProduit[s.article.designation] || 0,
          margeActuelle: ((s.article.prixVente - s.article.prixAchat) / s.article.prixAchat * 100).toFixed(2) + '%',
          reductionSuggeree: '10-15%',
          objectif: 'Écouler le stock',
        }))
        .slice(0, 10);

      return {
        type: 'OPTIMISATION_PROMOTIONS',
        produitsLents,
        recommandation: 'Ciblez les produits à rotation lente avec des réductions de 10-15% pour accélérer les ventes.',
      };
    }

    // Découverte d'opportunités de croissance
    if (
      this.contient(message, [
        'opportunité',
        'croissance',
        'développer',
        'expansion',
        'potentiel',
      ])
    ) {
      const debutMois = new Date();
      debutMois.setDate(1);
      debutMois.setHours(0, 0, 0, 0);

      const [ventes, clients, categories] = await Promise.all([
        this.prisma.vente.findMany({
          where: { tenantId, date: { gte: debutMois }, statut: 'PAYE' },
          include: {
            lignes: {
              include: {
                article: { 
                  select: { 
                    designation: true, 
                    categorie: true,
                    prixVente: true 
                  } 
                } 
              }
            }
          },
        }),
        this.prisma.client.findMany({
          where: { tenantId },
          include: { _count: { select: { ventes: true } } },
        }),
        this.prisma.article.findMany({
          where: { tenantId },
          select: { categorie: true, prixVente: true },
        }),
      ]);

      const ventesParCategorie: Record<string, { total: number; quantite: number }> = {};
      ventes.forEach(v => {
        v.lignes.forEach(l => {
          const cat = l.article.categorie?.nom || 'Non classé';
          if (!ventesParCategorie[cat]) {
            ventesParCategorie[cat] = { total: 0, quantite: 0 };
          }
          ventesParCategorie[cat].total += l.prix * l.quantite;
          ventesParCategorie[cat].quantite += l.quantite;
        });
      });

      const categoriesPerformantes = Object.entries(ventesParCategorie)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 5)
        .map(([cat, data]) => ({
          categorie: cat,
          total: data.total,
          quantite: data.quantite,
        }));

      const clientsFideles = clients.filter(c => c._count.ventes > 5).length;
      const tauxFidelite = clients.length > 0 ? (clientsFideles / clients.length * 100).toFixed(2) + '%' : '0%';
      const tauxFideliteNumber = parseFloat(tauxFidelite);

      return {
        type: 'OPPORTUNITES_CROISSANCE',
        categoriesPerformantes,
        tauxFidelite,
        totalClients: clients.length,
        recommandations: [
          'Focus sur les catégories les plus performantes',
          tauxFideliteNumber < 30 ? 'Lancer un programme de fidélité' : 'Maintenir la satisfaction client',
          'Explorer les produits complémentaires aux catégories leaders',
        ],
      };
    }

    return null;
  }

  private buildPrompt(
    ctx: TenantContext,
    question: string,
    donnees: any,
  ): string {
    const donneesTexte = donnees
      ? `\nDonnées réelles de la base de données :\n${JSON.stringify(donnees, null, 2)}`
      : '\nAucune donnée spécifique disponible pour cette question.';

    return `Tu es GeStock Assistant, l'assistant IA intégré au logiciel de gestion GeStock.

CONTEXTE :
- Entreprise : ${ctx.nomTenant}
- Type d'activité : ${ctx.metier.replace(/_/g, ' ')}
- Tu parles toujours en français
- Sois concis, précis et professionnel
- Tu ne peux accéder qu'aux données fournies ci-dessous
- Ne génère PAS de données fictives

${donneesTexte}

QUESTION DE L'UTILISATEUR : ${question}

INSTRUCTIONS :
- Réponds directement en utilisant les données fournies
- Si les données montrent des alertes (stock bas, DLC proche...) → mentionne-les clairement
- Utilise des chiffres précis issus des données
- Format : réponse courte et claire, avec des listes si nécessaire
- Si la question est hors contexte métier → redirige poliment vers les fonctionnalités GeStock
- Termine toujours par une courte suggestion d'action concrète

RÉPONSE :`;
  }

  private async callGemini(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return "Assistant IA non configuré. Veuillez contacter l'administrateur.";
    }

    try {
      const response = await fetch(`${this.GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 512,
            topP: 0.8,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return (
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        "Je n'ai pas pu générer une réponse. Veuillez réessayer."
      );
    } catch (error) {
      console.error('Gemini error:', error);
      return 'Désolé, le service IA est temporairement indisponible.';
    }
  }

  private getSuggestions(metier: string, message: string): string[] {
    const suggestions: Record<string, string[]> = {
      DEPOT_BOISSONS: [
        'Quels produits sont en rupture de stock ?',
        'Montre les ventes du jour',
        "Quel est le chiffre d'affaires de ce mois ?",
        'Combien de clients actifs ?',
      ],
      PHARMACIE: [
        'Quels médicaments expirent bientôt ?',
        'Montre les ventes du jour',
        'Quels médicaments sont presque épuisés ?',
        "Combien d'ordonnances ce mois ?",
      ],
      RESTAURANT: [
        'Combien de tables sont occupées ?',
        'Quelles commandes sont en cuisine ?',
        'Montre les ventes du jour',
        'Quels plats se vendent le plus ?',
      ],
      HOTEL: [
        'Combien de chambres libres ce soir ?',
        'Montre les réservations du jour',
        "Quel est le taux d'occupation ?",
        'Montre les recettes du jour',
      ],
      BOUTIQUE: [
        'Quels produits sont en rupture ?',
        'Montre les ventes du jour',
        'Quelles promotions sont actives ?',
        'Qui sont mes meilleurs clients ?',
      ],
      GARAGE_AUTOMOBILE: [
        'Combien de véhicules en atelier ?',
        'Quelles réparations sont prêtes ?',
        'Montre les recettes du jour',
        'Quelles pièces sont épuisées ?',
      ],
    };

    const defaults = [
      'Montre les ventes du jour',
      'Quels produits sont en rupture ?',
      'Quel est le bilan du mois ?',
      'Combien de clients actifs ?',
    ];

    return (suggestions[metier] ?? defaults)
      .filter((s) => s.length > 0)
      .slice(0, 3);
  }

  private contient(message: string, mots: string[]): boolean {
    return mots.some((mot) => message.includes(mot));
  }
}
