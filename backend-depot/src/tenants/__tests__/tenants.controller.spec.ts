import { Test, TestingModule } from '@nestjs/testing';
import { TenantsController } from '../tenants.controller';
import { TenantsService } from '../tenants.service';
import { UnauthorizedException } from '@nestjs/common';

describe('TenantsController', () => {
  let controller: TenantsController;
  let service: TenantsService;

  const mockTenant = {
    id: 'tenant-123',
    nomEntreprise: 'Test Company',
    metier: 'DEPOT_BOISSONS',
    email: 'test@example.com',
  };

  const mockUser = {
    userId: 'user-123',
    email: 'user@example.com',
    role: 'PATRON',
    tenantId: 'tenant-123',
    depotId: null,
  };

  const mockRequest = {
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        {
          provide: TenantsService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockTenant),
            findAll: jest.fn().mockResolvedValue([mockTenant]),
          },
        },
      ],
    }).compile();

    controller = module.get<TenantsController>(TenantsController);
    service = module.get<TenantsService>(TenantsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a single tenant', async () => {
      const result = await controller.findOne('tenant-123');
      expect(result).toEqual(mockTenant);
    });
  });

  describe('findAll', () => {
    it('should return an array of tenants', async () => {
      const result = await controller.findAll();
      expect(result).toEqual([mockTenant]);
    });
  });
});
