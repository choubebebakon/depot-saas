import { ForbiddenException } from '@nestjs/common';
import { DepotScopeInterceptor } from './depot-scope.interceptor';

function makeInterceptor(depotResult: unknown = { id: 'depot-1' }) {
  const prisma = {
    depot: { findFirst: jest.fn().mockResolvedValue(depotResult) },
    client: { findFirst: jest.fn() },
  } as any;
  const depotScope = { run: jest.fn((_scope, callback) => callback()) } as any;
  return {
    interceptor: new DepotScopeInterceptor(depotScope, prisma),
    prisma,
  };
}

describe('DepotScopeInterceptor — isolation', () => {
  it('autorise le Patron à sélectionner un dépôt actif de son tenant', async () => {
    const { interceptor, prisma } = makeInterceptor({ id: 'depot-2' });
    const result = await (interceptor as any).resolveDepotId(
      { tenantId: 'tenant-1', depotId: 'depot-1', role: 'PATRON' },
      'depot-2',
    );

    expect(result).toBe('depot-2');
    expect(prisma.depot.findFirst).toHaveBeenCalledWith({
      where: { id: 'depot-2', tenantId: 'tenant-1', isArchived: false },
      select: { id: true },
    });
  });

  it('refuse à un Gérant de sélectionner un autre dépôt tant que le modèle de membership n existe pas', async () => {
    const { interceptor, prisma } = makeInterceptor({ id: 'depot-1' });

    await expect(
      (interceptor as any).resolveDepotId(
        { tenantId: 'tenant-1', depotId: 'depot-1', role: 'GERANT' },
        'depot-2',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.depot.findFirst).not.toHaveBeenCalled();
  });

  it('refuse un dépôt appartenant à un autre tenant', async () => {
    const { interceptor } = makeInterceptor(null);

    await expect(
      (interceptor as any).resolveDepotId(
        { tenantId: 'tenant-1', depotId: 'depot-1', role: 'PATRON' },
        'depot-other-tenant',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuse un dépôt archivé', async () => {
    const { interceptor } = makeInterceptor(null);

    await expect(
      (interceptor as any).resolveDepotId(
        { tenantId: 'tenant-1', depotId: 'depot-1', role: 'PATRON' },
        'depot-archived',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuse les sources de depotId incohérentes', () => {
    const { interceptor } = makeInterceptor();
    const request = {
      headers: { 'x-depot-id': 'depot-1' },
      query: { depotId: 'depot-2' },
      body: { depotId: 'depot-1' },
    } as any;

    expect(() => (interceptor as any).getRequestedDepotId(request)).toThrow(ForbiddenException);
  });

  it('ignore les valeurs sentinelles non sécurisées', () => {
    const { interceptor } = makeInterceptor();
    const request = {
      headers: { 'x-depot-id': 'all' },
      query: { depotId: 'null' },
      body: { depotId: 'undefined' },
    } as any;

    expect((interceptor as any).getRequestedDepotId(request)).toBeNull();
  });
});
