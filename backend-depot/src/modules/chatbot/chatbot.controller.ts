import { Controller, Post, Get, Body, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ChatbotService, ChatMessageDto } from './chatbot.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma.service';

@Controller('chatbot')
@UseGuards(JwtAuthGuard)
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('message')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async message(@Body() dto: ChatMessageDto, @Req() req: any) {
    if (!req.user?.tenantId) throw new BadRequestException('Contexte utilisateur invalide.');
    if (typeof dto?.message !== 'string') throw new BadRequestException('Le message est obligatoire.');
    const message = dto.message.trim();
    if (!message || message.length > 500) {
      throw new BadRequestException('Le message doit contenir entre 1 et 500 caractères.');
    }

    // L'identité du tenant vient exclusivement du JWT authentifié.
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      select: { metier: true, nomEntreprise: true, name: true },
    });
    if (!tenant) throw new BadRequestException('Entreprise introuvable.');

    const ctx = {
      tenantId: req.user.tenantId,
      metier: tenant.metier ?? 'DEPOT_BOISSONS',
      nomTenant: tenant.nomEntreprise ?? tenant.name ?? 'Mon entreprise',
    };
    return this.chatbotService.chat(ctx, {
      message,
      contexte: typeof dto.contexte === 'string' ? dto.contexte.trim().slice(0, 500) : undefined,
    });
  }

  @Get('suggestions')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async suggestions(@Req() req: any) {
    if (!req.user?.tenantId) throw new BadRequestException('Contexte utilisateur invalide.');
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      select: { metier: true },
    });
    const metier = tenant?.metier ?? 'DEPOT_BOISSONS';

    const suggestionsParMetier: Record<string, string[]> = {
      DEPOT_BOISSONS: ['Prévoir les ventes du mois','Détecter les anomalies de stock','Recommandations de réapprovisionnement','Produits les plus rentables'],
      BOUTIQUE: ['Prévoir les ventes du mois','Détecter les anomalies de stock','Produits les plus rentables','Optimiser mes promotions'],
      QUINCAILLERIE: ['Prévoir les ventes du mois','Détecter les anomalies','Recommandations de réapprovisionnement','Opportunités de croissance'],
      PHARMACIE: ['Prévoir les ventes du mois','Détecter les anomalies','Produits les plus rentables','Générer un rapport automatique'],
      RESTAURANT: ["Anticiper les pics d'activité",'Prévoir les ventes du mois','Produits les plus rentables','Optimiser mes promotions'],
      TELEPHONIE: ['Prévoir les ventes du mois','Détecter les anomalies','Produits les plus rentables','Recommandations de réapprovisionnement'],
      SUPERMARCHE: ['Prévoir les ventes du mois','Détecter les anomalies','Recommandations de réapprovisionnement','Optimiser mes promotions'],
      CIMENT_BTP: ['Prévoir les ventes du mois','Détecter les anomalies',"Anticiper les pics d'activité",'Opportunités de croissance'],
      PRESSING: ['Prévoir les ventes du mois','Produits les plus rentables','Générer un rapport automatique','Optimiser mes promotions'],
      GARAGE_AUTOMOBILE: ['Prévoir les ventes du mois','Détecter les anomalies','Produits les plus rentables','Recommandations de réapprovisionnement'],
      ELEVAGE: ['Prévoir les ventes du mois','Détecter les anomalies','Opportunités de croissance','Générer un rapport automatique'],
      SALON_BEAUTE: ["Anticiper les pics d'activité",'Prévoir les ventes du mois','Produits les plus rentables','Optimiser mes promotions'],
      PARFUMERIE: ['Prévoir les ventes du mois','Détecter les anomalies','Produits les plus rentables','Optimiser mes promotions'],
      BOULANGERIE: ["Anticiper les pics d'activité",'Prévoir les ventes du mois','Produits les plus rentables','Générer un rapport automatique'],
      GLACIER_SNACK: ["Anticiper les pics d'activité",'Prévoir les ventes du mois','Produits les plus rentables','Optimiser mes promotions'],
      LIBRAIRIE: ['Prévoir les ventes du mois','Détecter les anomalies','Produits les plus rentables','Opportunités de croissance'],
      CLINIQUE: ["Anticiper les pics d'activité",'Prévoir les ventes du mois','Générer un rapport automatique','Opportunités de croissance'],
      TRANSPORT: ["Anticiper les pics d'activité",'Prévoir les ventes du mois','Détecter les anomalies','Opportunités de croissance'],
      IMMOBILIER: ['Prévoir les ventes du mois','Détecter les anomalies','Opportunités de croissance','Générer un rapport automatique'],
      HOTEL: ["Anticiper les pics d'activité",'Prévoir les ventes du mois','Produits les plus rentables','Générer un rapport automatique'],
    };
    return { metier, suggestions: suggestionsParMetier[metier] ?? ['Ventes du jour ?','Stock en rupture ?','Bilan du mois ?'] };
  }
}
