import { JwtService } from '@nestjs/jwt';
import { RealtimeGateway } from './realtime.gateway';

describe('RealtimeGateway', () => {
  const jwtService = {
    verifyAsync: jest.fn(),
  } as unknown as JwtService;

  const depotsService = {
    findOne: jest.fn().mockResolvedValue({ id: 'depot-1', isArchived: false }),
  } as any;
  const prismaService = {
    user: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        role: 'PATRON',
        tenantId: 'tenant-1',
        depotId: 'depot-1',
        isActive: true,
        isSuperAdmin: false,
        tenant: { estActif: true },
      }),
    },
  } as any;
  const gateway = new RealtimeGateway(jwtService, depotsService, prismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    gateway.server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;
  });

  function socket(overrides: any = {}) {
    return {
      id: 'socket-1',
      handshake: { auth: {}, headers: {}, ...overrides.handshake },
      data: {},
      join: jest.fn().mockResolvedValue(undefined),
      emit: jest.fn(),
      disconnect: jest.fn(),
      ...overrides,
    };
  }

  it('authenticates a valid JWT and joins tenant/depot rooms', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'user-1',
      tenantId: 'tenant-1',
      depotId: 'depot-1',
      role: 'PATRON',
    });
    const client = socket({
      handshake: { auth: { token: 'jwt-token' }, headers: {} },
    });

    await gateway.handleConnection(client);

    expect(client.join).toHaveBeenCalledWith('tenant:tenant-1');
    expect(client.join).toHaveBeenCalledWith('tenant:tenant-1:depot:depot-1');
    expect(client.disconnect).not.toHaveBeenCalled();
    expect(client.emit).toHaveBeenCalledWith('realtime:ready', {
      tenantId: 'tenant-1',
      depotId: 'depot-1',
    });
  });

  it('rejects a requested depot different from the JWT depot', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'user-1',
      tenantId: 'tenant-1',
      depotId: 'depot-1',
    });
    // Mock user with a role that is not PATRON (cannot switch depots)
    (prismaService.user.findFirst as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      role: 'GERANT',
      tenantId: 'tenant-1',
      depotId: 'depot-1',
      isActive: true,
      isSuperAdmin: false,
      tenant: { estActif: true },
    });
    const client = socket({
      handshake: {
        auth: { token: 'jwt-token', depotId: 'depot-2' },
        headers: {},
      },
    });

    await gateway.handleConnection(client);

    expect(client.emit).toHaveBeenCalledWith('realtime:error', {
      code: 'UNAUTHORIZED',
    });
    expect(client.disconnect).toHaveBeenCalledWith(true);
    expect(client.join).not.toHaveBeenCalled();
  });

  it('rejects a connection without a token', async () => {
    const client = socket();

    await gateway.handleConnection(client);

    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    expect(client.emit).toHaveBeenCalledWith('realtime:error', {
      code: 'UNAUTHORIZED',
    });
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('rejects a JWT without tenant identity', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'user-1' });
    const client = socket({
      handshake: { auth: { token: 'jwt-token' }, headers: {} },
    });

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('publishes depot events only to the scoped depot room', () => {
    gateway.publish({
      type: 'api.mutation',
      resource: 'stock',
      action: 'updated',
      tenantId: 'tenant-1',
      depotId: 'depot-1',
      actorUserId: 'user-1',
      occurredAt: new Date().toISOString(),
    });

    expect(gateway.server.to).toHaveBeenCalledWith(
      'tenant:tenant-1:depot:depot-1',
    );
    expect(gateway.server.to).not.toHaveBeenCalledWith('tenant:tenant-1');
  });
});
