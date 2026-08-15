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

  it('GERANT a accès total ailleurs', async () => {
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
    prisma.permission.findMany.mockResolvedValue([
      { role: Role.MAGASINIER },
    ]);

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
});
