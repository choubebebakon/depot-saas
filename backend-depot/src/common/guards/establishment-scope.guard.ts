import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma.service';

/**
 * Guard de scope établissement (§3/§5/§16/§23) :
 * - Pour le GERANT (gérant d'établissement) : vérifie que le depotId demandé
 *   appartient aux établissements autorisés de l'utilisateur (User.depotId + UserDepot).
 * - Pour les autres rôles : pas de restriction supplémentaire (PATRON = tout le tenant,
 *   CAISSIER/MAGASINIER/COMMERCIAL/COMPTABLE = scope via depotId header normal).
 *
 * Utilisation : @UseGuards(EstablishmentScopeGuard) sur les contrôleurs métier.
 */
@Injectable()
export class EstablishmentScopeGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    // Seulement pour GERANT (rôle gérant d'établissement)
    if (user.role !== Role.GERANT) {
      return true;
    }

    const tenantId = user.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('Aucun tenant associé');
    }

    // Récupère le depotId demandé (header, query, ou body)
    const requestedDepotId = this.extractDepotId(request);

    // Si aucun depotId demandé (ex: liste globale tenant), autoriser
    // Le service filtrera par les établissements autorisés
    if (!requestedDepotId) {
      return true;
    }

    // Vérifie que le GERANT a accès à cet établissement
    const hasAccess = await this.checkGerantDepotAccess(
      user.id,
      tenantId,
      requestedDepotId,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        'Accès non autorisé — cet établissement ne vous est pas assigné.',
      );
    }

    return true;
  }

  /**
   * Extrait le depotId depuis la requête (header > query > body)
   */
  private extractDepotId(request: any): string | null {
    // Header X-Depot-Id (priorité haute)
    const headerDepotId = request.headers?.['x-depot-id'];
    if (headerDepotId && headerDepotId !== 'all' && headerDepotId !== 'undefined') {
      return headerDepotId;
    }

    // Query param depotId
    const queryDepotId = request.query?.depotId;
    if (queryDepotId && queryDepotId !== 'all') {
      return queryDepotId;
    }

    // Body depotId (pour POST/PATCH)
    const bodyDepotId = request.body?.depotId;
    if (bodyDepotId && bodyDepotId !== 'all') {
      return bodyDepotId;
    }

    return null;
  }

  /**
   * Vérifie que le GERANT a accès au depotId demandé.
   * Accès = depotId par défaut (User.depotId) OU dans UserDepot.
   */
  private async checkGerantDepotAccess(
    userId: string,
    tenantId: string,
    depotId: string,
  ): Promise<boolean> {
    // 1. Vérifie depotId par défaut de l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { depotId: true },
    });

    if (user?.depotId === depotId) {
      return true;
    }

    // 2. Vérifie dans UserDepot (multi-établissements)
    const userDepot = await this.prisma.userDepot.findUnique({
      where: { userId_depotId: { userId, depotId } },
      select: { id: true },
    });

    return !!userDepot;
  }
}