import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type { PermissionAction } from './decorators/require-permission.decorator';
import {
  ADMINISTRATION_SUBMODULES,
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
  private readonly cache = new Map<string, { expiresAt: number; value: PermissionResult }>();

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
      const allowed = sousModule !== 'audit_patron';
      return {
        canRead: allowed,
        canWrite: allowed,
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
      libelleRoleAutorise: await this.getAuthorizedRoleLabel(metier, sousModule),
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
  }> {
    const libellePoste = roleLabel(role, metier);

    if (role === Role.PATRON) {
      return {
        fullAccess: true,
        denySousModules: [],
        permissions: {},
        libellePoste,
      };
    }

    if (role === Role.GERANT) {
      return {
        fullAccess: true,
        denySousModules: ['audit_patron'],
        permissions: {},
        libellePoste,
      };
    }

    const rows = await this.prisma.permission.findMany({
      where: { role: role as Role, metier },
      select: { sousModule: true, canRead: true, canWrite: true },
    });

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

  private async getAuthorizedRoleLabel(
    metier: PermissionMetier,
    sousModule: string,
  ): Promise<string> {
    if (sousModule === 'audit_patron') return roleLabel(Role.PATRON, metier);
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
