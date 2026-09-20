import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleUser } from '@prisma/client';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string; role: string; tenantId: string; depotId: string | null };
}


import { Roles } from '../../auth/decorators/roles.decorator';
import { MetaIntegrationService, MetaIntegrationView } from '../services/meta-integration.service';
import { ConnectMetaIntegrationDto } from '../dto/connect-meta-integration.dto';

/**
 * Contrôleur dashboard des intégrations Meta — PARTIE 2 (réception du code) et
 * PARTIE 4 (supervision). L'ancien décorateur de classe excluait les routes
 * publiques du webhook du controller ; le webhook a son propre contrôleur
 * public, celui-ci reste entièrement protégé par les guards globaux (JWT +
 * rôles). Le tenant vient EXCLUSIVEMENT du JWT (`req.user.tenantId`) — jamais
 * du body ni d'un header : aucun commerçant ne peut agir sur l'intégration
 * d'un autre.
 */
@ApiTags('Meta Intégrations')
@Controller('meta/integrations')
export class MetaIntegrationsController {
  constructor(private readonly integrations: MetaIntegrationService) {}

  private requireTenant(req: AuthenticatedRequest): string {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error('Tenant introuvable dans la session.');
    }
    return tenantId;
  }

  /**
   * PARTIE 2 : reçoit le code d'autorisation renvoyé par le SDK JS Embedded
   * Signup dans le callback navigateur (fait vérifié n°1 — ce N'EST PAS une
   * route de redirection Meta). Déclenche la chaîne d'onboarding complète :
   * échange du code → debug_token → register numéro → subscribed_apps →
   * chiffrement AES-256-GCM → persistance.
   */
  @Post()
  @Roles(RoleUser.PATRON, RoleUser.GERANT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Connexion Meta : échange du code + onboarding complet (register, subscribed_apps)' })
  @ApiResponse({ status: 201, description: 'Intégration connectée' })
  @ApiResponse({ status: 400, description: 'Code invalide ou WABA/numéro manquant' })
  @ApiResponse({ status: 409, description: 'Ce canal est déjà rattaché à un autre compte' })
  async connect(@Req() req: AuthenticatedRequest, @Body() dto: ConnectMetaIntegrationDto): Promise<MetaIntegrationView> {
    return this.integrations.connectFromCode(this.requireTenant(req), dto.code);
  }

  /** PARTIE 4 : liste des canaux connectés du commerçant (sans aucun secret). */
  @Get()
  @Roles(RoleUser.PATRON, RoleUser.GERANT)
  async list(@Req() req: AuthenticatedRequest): Promise<{ integrations: MetaIntegrationView[] }> {
    const integrations = await this.integrations.listForTenant(this.requireTenant(req));
    return { integrations };
  }

  /** PARTIE 4 : vérification à la demande (debug_token — fait vérifié n°5). */
  @Get(':id/verify')
  @Roles(RoleUser.PATRON, RoleUser.GERANT)
  @ApiOperation({ summary: 'Vérification de validité du token (debug_token)' })
  async verify(@Req() req: AuthenticatedRequest, @Param('id') integrationId: string): Promise<MetaIntegrationView> {
    return this.integrations.verifyIntegration(this.requireTenant(req), integrationId);
  }

  /** PARTIE 4 : révocation par le commerçant. */
  @Delete(':id')
  @Roles(RoleUser.PATRON, RoleUser.GERANT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Révocation de la connexion Meta' })
  async revoke(@Req() req: AuthenticatedRequest, @Param('id') integrationId: string): Promise<void> {
    await this.integrations.revokeIntegration(this.requireTenant(req), integrationId);
  }
}
