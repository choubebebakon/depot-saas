import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type { PermissionAction } from './decorators/require-permission.decorator';
import {
  ADMINISTRATION_SUBMODULES,
  GERANT_DENY_SOUS_MODULES,
  PermissionMetier,
  normalizePermissionMetier,
  normalizeSousModule,
  roleLabel,
} from './permissions.config';

export interface PermissionResult {
  canRead: boolean;
  canWrite: boolean;
  libelleRoleAutorise: string;
}

const CACHE_TTL_MS = 60_000;

@Injectable()
export class PermissionService {
  private readonly cache = new Map<
    string,
    { expiresAt: number; value: PermissionResult }
  >();

  private readonly actionCache = new Map<
    string,
    { expiresAt: number; value: boolean }
  >();

  constructor(private readonly prisma: PrismaService) {}

  async resolveMetierSlug(
    tenantId?: string,
    routeMetier?: string,
    userMetier?: string,
  ): Promise<PermissionMetier | null> {
    const fromRoute = normalizePermissionMetier(routeMetier);
    if (fromRoute) return fromRoute;

    const fromUser = normalizePermissionMetier(userMetier);
    if (fromUser) return fromUser;

    if (!tenantId) return null;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { metier: true },
    });

    return normalizePermissionMetier(tenant?.metier);
  }

  async getPermission(
    role: string,
    metier: PermissionMetier,
    rawSousModule: string,
  ): Promise<PermissionResult> {
    const sousModule = normalizeSousModule(rawSousModule);

    if (role === Role.PATRON) {
      return {
        canRead: true,
        canWrite: true,
        libelleRoleAutorise: roleLabel(Role.PATRON, metier),
      };
    }

    if (role === Role.GERANT) {
      // §3/§23 — le GERANT est un gérant d'ÉTABLISSEMENT, pas un admin tenant :
      // audit patron, abonnement et administration des dépôts (nouvel
      // établissement) lui sont interdits. Tout le reste est opérationnel.
      const deniedForGerant = GERANT_DENY_SOUS_MODULES.includes(sousModule);
      return {
        canRead: !deniedForGerant,
        canWrite: !deniedForGerant,
        libelleRoleAutorise: roleLabel(Role.PATRON, metier),
      };
    }

    if (ADMINISTRATION_SUBMODULES.has(sousModule)) {
      return {
        canRead: false,
        canWrite: false,
        libelleRoleAutorise: 'Patron ou Gérant',
      };
    }

    const cacheKey = `${role}:${metier}:${sousModule}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const permission = await this.prisma.permission.findUnique({
      where: {
        role_metier_sousModule: {
          role: role as Role,
          metier,
          sousModule,
        },
      },
      select: { canRead: true, canWrite: true },
    });

    const value = {
      canRead: permission?.canRead ?? false,
      canWrite: permission?.canWrite ?? false,
      libelleRoleAutorise: await this.getAuthorizedRoleLabel(
        metier,
        sousModule,
      ),
    };

    this.cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, value });
    return value;
  }

  /** Carte des permissions pour le frontend (sidebar + pages). */
  async getPermissionsForUser(
    role: string,
    metier: PermissionMetier,
  ): Promise<{
    fullAccess: boolean;
    denySousModules: string[];
    permissions: Record<string, { canRead: boolean; canWrite: boolean }>;
    libellePoste: string;
    actions: string[];
    actionsFullAccess: boolean;
  }> {
    const libellePoste = roleLabel(role, metier);

    if (role === Role.PATRON) {
      return {
        fullAccess: true,
        denySousModules: [],
        permissions: {},
        libellePoste,
        // §14 — PATRON et GERANT voient toutes les actions (le backend
        // reste seul juge via canPerformAction).
        actions: [],
        actionsFullAccess: true,
      };
    }

    if (role === Role.GERANT) {
      return {
        fullAccess: true,
        // §3/§23 — administration tenant interdite au gérant d'établissement.
        denySousModules: [...GERANT_DENY_SOUS_MODULES],
        permissions: {},
        libellePoste,
        actions: [],
        actionsFullAccess: true,
      };
    }

    const [rows, actionMap] = await Promise.all([
      this.prisma.permission.findMany({
        where: { role: role as Role, metier },
        select: { sousModule: true, canRead: true, canWrite: true },
      }),
      this.getActionsForUser(role, metier),
    ]);

    const permissions: Record<string, { canRead: boolean; canWrite: boolean }> =
      {};
    for (const row of rows) {
      permissions[row.sousModule] = {
        canRead: row.canRead,
        canWrite: row.canWrite,
      };
    }

    return {
      fullAccess: false,
      denySousModules: [],
      permissions,
      libellePoste,
      // Liste des actions fines accordées (masquage des boutons côté UI).
      actions: actionMap.actions,
      actionsFullAccess: actionMap.fullAccess,
    };
  }

  async canAccess(
    role: string,
    metier: PermissionMetier,
    sousModule: string,
    action: PermissionAction,
  ): Promise<PermissionResult & { allowed: boolean }> {
    const permission = await this.getPermission(role, metier, sousModule);
    return {
      ...permission,
      allowed: action === 'write' ? permission.canWrite : permission.canRead,
    };
  }

  /**
   * §14 — Permission d'action fine (ventes.annuler, caisse.fermer,
   * stock.ajuster…). Deny-by-default : l'action doit exister dans la table
   * ActionPermission avec allowed=true pour ce rôle×métier. PATRON et GERANT
   * sont toujours autorisés (gérés en code, comme pour les sous-modules).
   */
  async canPerformAction(
    role: string,
    metier: PermissionMetier,
    action: string,
  ): Promise<boolean> {
    if (role === Role.PATRON || role === Role.GERANT) return true;

    const cacheKey = `action:${role}:${metier}:${action}`;
    const cached = this.actionCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const row = await this.prisma.actionPermission.findUnique({
      where: {
        role_metier_action: {
          role: role as Role,
          metier,
          action,
        },
      },
      select: { allowed: true },
    });

    const value = row?.allowed ?? false;
    this.actionCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      value,
    });
    return value;
  }

  /** Carte des actions accordées à un rôle (pour masquer les boutons côté UI). */
  async getActionsForUser(
    role: string,
    metier: PermissionMetier,
  ): Promise<{ fullAccess: boolean; actions: string[] }> {
    if (role === Role.PATRON || role === Role.GERANT) {
      return { fullAccess: true, actions: [] };
    }
    const rows = await this.prisma.actionPermission.findMany({
      where: { role: role as Role, metier, allowed: true },
      select: { action: true },
    });
    return { fullAccess: false, actions: rows.map((r) => r.action) };
  }

  private async getAuthorizedRoleLabel(
    metier: PermissionMetier,
    sousModule: string,
  ): Promise<string> {
    if (
      sousModule === 'audit_patron' ||
      sousModule === 'abonnement' ||
      sousModule === 'depots'
    ) {
      return roleLabel(Role.PATRON, metier);
    }
    if (ADMINISTRATION_SUBMODULES.has(sousModule)) return 'Patron ou Gérant';

    const rows = await this.prisma.permission.findMany({
      where: {
        metier,
        sousModule,
        OR: [{ canRead: true }, { canWrite: true }],
      },
      select: { role: true },
      orderBy: { role: 'asc' },
    });

    const labels = Array.from(
      new Set(rows.map((row) => roleLabel(row.role, metier))),
    );

    return labels.length > 0 ? labels.join(' ou ') : 'Patron ou Gérant';
  }
}
