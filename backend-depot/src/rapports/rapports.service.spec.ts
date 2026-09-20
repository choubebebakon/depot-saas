import { ForbiddenException } from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { RapportsService } from './rapports.service';

describe('RapportsService — §10 « Mes performances » (self-scope §7)', () => {
  let service: RapportsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 'u-1', email: 'c1@x' }, { id: 'u-2', email: 'c2@x' }]),
      },
      vente: { findMany: jest.fn().mockResolvedValue([]) },
      tournee: { findMany: jest.fn().mockResolvedValue([]) },
      mouvementStock: { findMany: jest.fn().mockResolvedValue([]) },
      depense: { aggregate: jest.fn().mockResolvedValue({ _sum: { montant: 0 }, _count: { id: 0 } }) },
      depot: { findFirst: jest.fn().mockResolvedValue({ id: 'depot-1' }) },
    };
    service = new RapportsService(prisma);
  });

  it('un COMMERCIAL ne voit que sa propre ligne (defense-in-depth)', async () => {
    const rows = await service.getPerformanceCommerciaux(
      { userId: 'u-1', role: RoleUser.COMMERCIAL, tenantId: 't-1', depotId: 'depot-1' },
      'depot-1',
    );

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'u-1', role: RoleUser.COMMERCIAL }),
      }),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].commercialId).toBe('u-1');
  });

  it('un GERANT voit le classement complet, verrouillé sur son dépôt', async () => {
    const rows = await service.getPerformanceCommerciaux(
      { role: RoleUser.GERANT, tenantId: 't-1', depotId: 'depot-1' },
      'depot-1',
    );

    expect(rows).toHaveLength(2);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ id: expect.anything() }),
      }),
    );
  });

  it("refuse un GERANT qui demande un dépôt qui n'est pas le sien", async () => {
    await expect(
      service.getPerformanceCommerciaux(
        { role: RoleUser.GERANT, tenantId: 't-1', depotId: 'depot-1' },
        'depot-B',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuse un GERANT sans dépôt', async () => {
    await expect(
      service.getPerformanceCommerciaux(
        { role: RoleUser.GERANT, tenantId: 't-1', depotId: null },
        undefined,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
