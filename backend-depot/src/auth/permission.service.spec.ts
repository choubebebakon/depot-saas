import { Role } from '@prisma/client';
import { PermissionService } from './permission.service';
import { PermissionMetier } from './permissions.config';

describe('PermissionService', () => {
  let service: PermissionService;
  let prisma: {
    permission: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
    tenant: { findUnique: jest.Mock };
  };

  const metier: PermissionMetier = 'supermarche';

  beforeEach(() => {
    prisma = {
      permission: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      tenant: { findUnique: jest.fn() },
    };
    service = new PermissionService(prisma as any);
  });

  it('PATRON a un accès total sans consulter la table', async () => {
    const result = await service.canAccess(
      Role.PATRON,
      metier,
      'stock',
      'write',
    );
    expect(result.allowed).toBe(true);
    expect(result.canRead).toBe(true);
    expect(result.canWrite).toBe(true);
    expect(prisma.permission.findUnique).not.toHaveBeenCalled();
  });

  it('GERANT est refusé sur audit_patron', async () => {
    const result = await service.canAccess(
      Role.GERANT,
      metier,
      'audit_patron',
      'read',
    );
    expect(result.allowed).toBe(false);
    expect(prisma.permission.findUnique).not.toHaveBeenCalled();
  });

  it('GERANT est refusé sur abonnement (lecture et écriture réservées au PATRON)', async () => {
    const read = await service.canAccess(
      Role.GERANT,
      metier,
      'abonnement',
      'read',
    );
    const write = await service.canAccess(
      Role.GERANT,
      metier,
      'abonnement',
      'write',
    );
    expect(read.allowed).toBe(false);
    expect(write.allowed).toBe(false);
    expect(prisma.permission.findUnique).not.toHaveBeenCalled();
  });

  it('PATRON a accès à abonnement', async () => {
    const read = await service.canAccess(
      Role.PATRON,
      metier,
      'abonnement',
      'read',
    );
    expect(read.allowed).toBe(true);
  });

  it('getPermissionsForUser renvoie denySousModules avec audit_patron et abonnement pour GERANT', async () => {
    const perms = await service.getPermissionsForUser(Role.GERANT, metier);
    expect(perms.fullAccess).toBe(true);
    expect(perms.denySousModules).toContain('audit_patron');
    expect(perms.denySousModules).toContain('abonnement');
  });

  it('GERANT a accès opérationnel sur les modules métier', async () => {
    const result = await service.canAccess(
      Role.GERANT,
      metier,
      'stock',
      'write',
    );
    expect(result.allowed).toBe(true);
  });

  it('refuse les modules admin aux rôles non PATRON/GERANT', async () => {
    const result = await service.canAccess(
      Role.CAISSIER,
      metier,
      'utilisateurs',
      'read',
    );
    expect(result.allowed).toBe(false);
    expect(result.libelleRoleAutorise).toMatch(/Patron/);
    expect(prisma.permission.findUnique).not.toHaveBeenCalled();
  });

  it('CAISSIER reçoit 403 logique hors allow-list (deny-by-default)', async () => {
    prisma.permission.findUnique.mockResolvedValue(null);
    prisma.permission.findMany.mockResolvedValue([{ role: Role.MAGASINIER }]);

    const denied = await service.canAccess(
      Role.CAISSIER,
      metier,
      'stock',
      'read',
    );
    expect(denied.allowed).toBe(false);
    expect(denied.libelleRoleAutorise).toContain('Rayonniste');
  });

  it('CAISSIER est autorisé en lecture sur pos_caisse si seedé', async () => {
    prisma.permission.findUnique.mockResolvedValue({
      canRead: true,
      canWrite: true,
    });

    const allowed = await service.canAccess(
      Role.CAISSIER,
      metier,
      'pos_caisse',
      'read',
    );
    expect(allowed.allowed).toBe(true);
    expect(allowed.canWrite).toBe(true);
  });

  it('écriture refusée si canWrite false même avec canRead true', async () => {
    prisma.permission.findUnique.mockResolvedValue({
      canRead: true,
      canWrite: false,
    });

    const read = await service.canAccess(
      Role.COMPTABLE,
      metier,
      'stock',
      'read',
    );
    const write = await service.canAccess(
      Role.COMPTABLE,
      metier,
      'stock',
      'write',
    );
    expect(read.allowed).toBe(true);
    expect(write.allowed).toBe(false);
  });

  // ── §3/§23 — GERANT ≠ admin tenant ────────────────────────────────────────
  it('GERANT est refusé sur depots (administration tenant)', async () => {
    const read = await service.canAccess(Role.GERANT, metier, 'depots', 'read');
    const write = await service.canAccess(
      Role.GERANT,
      metier,
      'depots',
      'write',
    );
    expect(read.allowed).toBe(false);
    expect(write.allowed).toBe(false);
    expect(prisma.permission.findUnique).not.toHaveBeenCalled();
  });

  it('GERANT garde ses accès opérationnels (ventes, rapports, utilisateurs, parametres)', async () => {
    for (const sousModule of ['ventes', 'rapports', 'utilisateurs', 'parametres']) {
      const result = await service.canAccess(
        Role.GERANT,
        metier,
        sousModule,
        'read',
      );
      expect(result.allowed).toBe(true);
    }
  });

  it('getPermissionsForUser GERANT inclut depots dans denySousModules', async () => {
    const perms = await service.getPermissionsForUser(Role.GERANT, metier);
    expect(perms.denySousModules).toEqual(
      expect.arrayContaining(['audit_patron', 'abonnement', 'depots']),
    );
  });

  // ── §10 — granularité des rapports ───────────────────────────────────────
  it('CAISSIER : rapports refusé (deny-by-default, aucune ligne seedée)', async () => {
    prisma.permission.findUnique.mockResolvedValue(null);
    const result = await service.canAccess(
      Role.CAISSIER,
      metier,
      'rapports',
      'read',
    );
    expect(result.allowed).toBe(false);
  });

  it('COMMERCIAL : rapports refusé, rapports_performance accordé', async () => {
    prisma.permission.findUnique.mockImplementation(
      (_args: any) => Promise.resolve(null),
    );
    const denied = await service.canAccess(
      Role.COMMERCIAL,
      metier,
      'rapports',
      'read',
    );
    expect(denied.allowed).toBe(false);

    prisma.permission.findUnique.mockResolvedValue({
      canRead: true,
      canWrite: false,
    });
    const allowed = await service.canAccess(
      Role.COMMERCIAL,
      metier,
      'rapports_performance',
      'read',
    );
    expect(allowed.allowed).toBe(true);
  });

  it('MAGASINIER : rapports_stock accordé, rapports refusé', async () => {
    prisma.permission.findUnique.mockResolvedValue(null);
    const denied = await service.canAccess(
      Role.MAGASINIER,
      metier,
      'rapports',
      'read',
    );
    expect(denied.allowed).toBe(false);

    prisma.permission.findUnique.mockResolvedValue({
      canRead: true,
      canWrite: false,
    });
    const allowed = await service.canAccess(
      Role.MAGASINIER,
      metier,
      'rapports_stock',
      'read',
    );
    expect(allowed.allowed).toBe(true);
  });

  it('COMPTABLE : rapports financiers accordés (lecture + écriture seedées)', async () => {
    prisma.permission.findUnique.mockResolvedValue({
      canRead: true,
      canWrite: true,
    });
    const result = await service.canAccess(
      Role.COMPTABLE,
      metier,
      'rapports',
      'read',
    );
    expect(result.allowed).toBe(true);
  });
});
