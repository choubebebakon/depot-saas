import { Test, TestingModule } from '@nestjs/testing';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

const mockTenantsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
};

describe('TenantsController', () => {
  let controller: TenantsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        {
          provide: TenantsService,
          useValue: mockTenantsService,
        },
      ],
    }).compile();

    controller = module.get<TenantsController>(TenantsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
