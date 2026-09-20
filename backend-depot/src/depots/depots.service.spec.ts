import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { DepotsService } from './depots.service';

describe('DepotsService — Multi-tenant & Multi-dépôt Security', () => {
  let service: DepotsService;
  let prisma: any;

  const tenantId = 'tenant-uuid-1';
  const depotA = 'depot-uuid-a';
  const depotB = 'depot-uuid-b';

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(async (cb) => cb(prisma)),
      $queryRaw: jest.fn().mockResolvedValue([]),
      // Affectations multi-établissements (§13) : aucun UserDepot seedé ici,
      // le périmètre des non-PATRON = leur dépôt principal uniquement.
      userDepot: { findMany: jest.fn().mockResolvedValue([]) },
      tenant: {
        findUnique: jest.fn().mockResolvedValue({ planType: 'BUSINESS' }),
      },
      depot: {
        findMany: jest.fn().mockResolvedValue([
          { id: depotA, nom: 'Dépôt Principal', tenantId, isArchived: false },
          { id: depotB, nom: 'Dépôt Annexe', tenantId, isArchived: false },
        ]),
        findFirst: jest.fn().mockImplementation(({ where }) => {
          if (where.id === depotA && where.tenantId === tenantId) {
            return Promise.resolve({
              id: depotA,
              nom: 'Dépôt Principal',
              tenantId,
              isArchived: false,
              _count: { users: 0 },
            });
          }
          if (where.id === depotB && where.tenantId === tenantId) {
            return Promise.resolve({
              id: depotB,
              nom: 'Dépôt Annexe',
              tenantId,
              isArchived: false,
              _count: { users: 0 },
            });
          }
          return Promise.resolve(null);
        }),
        create: jest.fn().mockResolvedValue({ id: 'depot-new', nom: 'Nouveau Dépôt' }),
        update: jest.fn().mockImplementation(({ where, data }) => ({
          id: where.id,
          ...data,
        })),
        count: jest.fn().mockResolvedValue(2),
      },
    };

    service = new DepotsService(prisma as any);
  });

  describe('findAll', () => {
    it('PATRON voit tous les dépôts actifs du tenant', async () => {
      const patronUser = {
        userId: 'user-patron',
        email: 'patron@example.com',
        role: RoleUser.PATRON,
        tenantId,
        depotId: null,
      };

      await service.findAll(patronUser);

      expect(prisma.depot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, isArchived: false },
        }),
      );
    });

    it('GERANT ne voit que son propre dépôt affecté', async () => {
      const gerantUser = {
        userId: 'user-gerant',
        email: 'gerant@example.com',
        role: RoleUser.GERANT,
        tenantId,
        depotId: depotA,
      };

      await service.findAll(gerantUser);

      // §16 — le périmètre du gérant est résolu serveur (dépôt principal ∪
      // affectations UserDepot) et injecté dans le filtre Prisma.
      expect(prisma.depot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId,
            isArchived: false,
            id: { in: [depotA] },
          },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('PATRON peut consulter n’importe quel dépôt du tenant', async () => {
      const patronUser = {
        userId: 'user-patron',
        email: 'patron@example.com',
        role: RoleUser.PATRON,
        tenantId,
        depotId: null,
      };

      const result = await service.findOne(depotB, patronUser);
      expect(result.id).toBe(depotB);
    });

    it('GERANT peut consulter son propre dépôt', async () => {
      const gerantUser = {
        userId: 'user-gerant',
        email: 'gerant@example.com',
        role: RoleUser.GERANT,
        tenantId,
        depotId: depotA,
      };

      const result = await service.findOne(depotA, gerantUser);
      expect(result.id).toBe(depotA);
    });

    it('GERANT se voit refuser l’accès aux détails d’un autre dépôt', async () => {
      const gerantUser = {
        userId: 'user-gerant',
        email: 'gerant@example.com',
        role: RoleUser.GERANT,
        tenantId,
        depotId: depotA,
      };

      await expect(service.findOne(depotB, gerantUser)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('PATRON est autorisé à créer un dépôt', async () => {
      const patronUser = {
        userId: 'user-patron',
        email: 'patron@example.com',
        role: RoleUser.PATRON,
        tenantId,
        depotId: null,
      };

      const result = await service.create(
        { nom: 'Nouveau', adresse: 'Rue 1', emplacement: 'Ville' },
        patronUser,
      );
      expect(result.id).toBe('depot-new');
    });

    it('GERANT se voit refuser la création d’un dépôt', async () => {
      const gerantUser = {
        userId: 'user-gerant',
        email: 'gerant@example.com',
        role: RoleUser.GERANT,
        tenantId,
        depotId: depotA,
      };

      await expect(
        service.create(
          { nom: 'Nouveau', adresse: 'Rue 1', emplacement: 'Ville' },
          gerantUser,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('update', () => {
    it('GERANT peut modifier les informations de son propre dépôt', async () => {
      const gerantUser = {
        userId: 'user-gerant',
        email: 'gerant@example.com',
        role: RoleUser.GERANT,
        tenantId,
        depotId: depotA,
      };

      const result = await service.update(
        depotA,
        { nom: 'Dépôt Principal Renommé' },
        gerantUser,
      );
      expect(result.nom).toBe('Dépôt Principal Renommé');
    });

    it('GERANT ne peut pas modifier un autre dépôt', async () => {
      const gerantUser = {
        userId: 'user-gerant',
        email: 'gerant@example.com',
        role: RoleUser.GERANT,
        tenantId,
        depotId: depotA,
      };

      await expect(
        service.update(depotB, { nom: 'Piratage' }, gerantUser),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('GERANT ne peut pas archiver son dépôt', async () => {
      const gerantUser = {
        userId: 'user-gerant',
        email: 'gerant@example.com',
        role: RoleUser.GERANT,
        tenantId,
        depotId: depotA,
      };

      await expect(
        service.update(depotA, { isArchived: true }, gerantUser),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('GERANT se voit refuser l’archivage d’un dépôt', async () => {
      const gerantUser = {
        userId: 'user-gerant',
        email: 'gerant@example.com',
        role: RoleUser.GERANT,
        tenantId,
        depotId: depotA,
      };

      await expect(service.remove(depotA, gerantUser)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('PATRON peut archiver un dépôt', async () => {
      const patronUser = {
        userId: 'user-patron',
        email: 'patron@example.com',
        role: RoleUser.PATRON,
        tenantId,
        depotId: null,
      };

      const result = await service.remove(depotA, patronUser);
      expect(result.isArchived).toBe(true);
    });
  });
});
