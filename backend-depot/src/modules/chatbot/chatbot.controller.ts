import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
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
  async message(@Body() dto: ChatMessageDto, @Req() req: any) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      select: { metier: true, nomEntreprise: true, name: true },
    });

    const ctx = {
      tenantId: req.user.tenantId,
      metier: tenant?.metier ?? 'DEPOT_BOISSONS',
      nomTenant: tenant?.nomEntreprise ?? tenant?.name ?? 'Mon entreprise',
    };
    return this.chatbotService.chat(ctx, dto);
  }

  @Get('suggestions')
  async suggestions(@Req() req: any) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      select: { metier: true },
    });
    const metier = tenant?.metier ?? 'DEPOT_BOISSONS';

    const suggestionsParMetier: Record<string, string[]> = {
      DEPOT_BOISSONS: [
        'Ventes du jour ?',
        'Stock en rupture ?',
        'Meilleurs clients ?',
      ],
      BOUTIQUE: [
        'Ventes du jour ?',
        'Ruptures de stock ?',
        'Promotions actives ?',
      ],
      QUINCAILLERIE: [
        'Devis en attente ?',
        'Chantiers actifs ?',
        'Stock critique ?',
      ],
      PHARMACIE: [
        'Médicaments expirant bientôt ?',
        'Stock critique ?',
        'Ventes du jour ?',
      ],
      RESTAURANT: [
        'Tables occupées ?',
        'Commandes en cuisine ?',
        'Recettes du jour ?',
      ],
      TELEPHONIE: [
        'Stocks téléphones ?',
        'Réparations en cours ?',
        'Ventes du jour ?',
      ],
      SUPERMARCHE: [
        'Ventes du jour ?',
        'Produits en rupture ?',
        'Caisse du jour ?',
      ],
      CIMENT_BTP: [
        'Livraisons du jour ?',
        'Chantiers en cours ?',
        'Véhicules disponibles ?',
      ],
      PRESSING: [
        'Tickets en attente ?',
        'Vêtements prêts ?',
        'Recettes du jour ?',
      ],
      GARAGE_AUTOMOBILE: [
        'Véhicules en atelier ?',
        'Réparations prêtes ?',
        'Recettes du jour ?',
      ],
      ELEVAGE: ['État des lots ?', 'Événements récents ?', 'Stock aliment ?'],
      SALON_BEAUTE: [
        'RDV du jour ?',
        'Prestations populaires ?',
        "Chiffre d'affaires ?",
      ],
      PARFUMERIE: [
        'Ventes du jour ?',
        'Produits en rupture ?',
        'Fidélité clients ?',
      ],
      BOULANGERIE: ['Production du jour ?', 'Ventes du jour ?', 'Recettes ?'],
      GLACIER_SNACK: [
        'Tables occupées ?',
        'Commandes en cours ?',
        'Menu du jour ?',
      ],
      LIBRAIRIE: ['Ventes du jour ?', 'Nouveautés ?', 'Commandes ?'],
      CLINIQUE: [
        'RDV du jour ?',
        'Patients en attente ?',
        'Consultations du mois ?',
      ],
      TRANSPORT: [
        'Colis en transit ?',
        'Trajets du jour ?',
        'Recettes du jour ?',
      ],
      IMMOBILIER: [
        'Biens disponibles ?',
        'Loyers en retard ?',
        'Revenus du mois ?',
      ],
      HOTEL: [
        'Chambres disponibles ?',
        'Réservations du jour ?',
        'Taux occupation ?',
      ],
    };

    return {
      metier,
      suggestions: suggestionsParMetier[metier] ?? [
        'Ventes du jour ?',
        'Stock en rupture ?',
        'Bilan du mois ?',
      ],
    };
  }
}
