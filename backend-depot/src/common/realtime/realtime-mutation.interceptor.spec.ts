import { RealtimeMutationInterceptor } from './realtime-mutation.interceptor';

describe('RealtimeMutationInterceptor', () => {
  const realtime = { publish: jest.fn() } as any;
  const depotScope = {
    getTenantId: jest.fn(),
    getDepotId: jest.fn(),
  } as any;
  const interceptor = new RealtimeMutationInterceptor(realtime, depotScope);

  beforeEach(() => {
    jest.clearAllMocks();
    depotScope.getTenantId.mockReturnValue(null);
    depotScope.getDepotId.mockReturnValue(null);
  });

  function context(method: string, url: string, user: any = {}) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ method, url, originalUrl: url, user }),
      }),
    } as any;
  }

  it('publishes only after a successful mutating request', () => {
    const next = { handle: jest.fn(() => ({ pipe: (operator: any) => operator({}) })) } as any;
    const result = interceptor.intercept(
      context('POST', '/api/v1/stock/entries', { tenantId: 'tenant-1', depotId: 'depot-1', userId: 'user-1' }),
      next,
    );

    expect(result).toBeDefined();
    expect(realtime.publish).toHaveBeenCalledWith(expect.objectContaining({
      type: 'api.mutation',
      resource: 'stock:entries',
      action: 'created',
      tenantId: 'tenant-1',
      depotId: 'depot-1',
      actorUserId: 'user-1',
    }));
  });

  it('does not publish read-only requests', () => {
    const next = { handle: jest.fn(() => ({ pipe: jest.fn() })) } as any;

    interceptor.intercept(context('GET', '/api/v1/stock', { tenantId: 'tenant-1' }), next);

    expect(next.handle).toHaveBeenCalled();
    expect(realtime.publish).not.toHaveBeenCalled();
  });

  it('does not publish without a tenant scope', () => {
    const next = { handle: jest.fn(() => ({ pipe: (operator: any) => operator({}) })) } as any;

    interceptor.intercept(context('POST', '/api/v1/stock', { userId: 'user-1' }), next);

    expect(realtime.publish).not.toHaveBeenCalled();
  });

  it('maps PUT, PATCH and DELETE to the correct actions', () => {
    for (const [method, action] of [['PUT', 'updated'], ['PATCH', 'updated'], ['DELETE', 'deleted']] as const) {
      jest.clearAllMocks();
      const next = { handle: jest.fn(() => ({ pipe: (operator: any) => operator({}) })) } as any;
      interceptor.intercept(
        context(method, '/api/v1/clients/123', { tenantId: 'tenant-1', depotId: 'depot-1' }),
        next,
      );
      expect(realtime.publish).toHaveBeenCalledWith(expect.objectContaining({ action }));
    }
  });
});
