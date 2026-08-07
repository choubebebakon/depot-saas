import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';

describe('Platform Admin (e2e)', () => {
  let app: INestApplication;
  
  // Mock function to easily switch user payload
  let mockUser: any = null;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({
      canActivate: (context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        if (mockUser) {
          req.user = mockUser;
          return true;
        }
        return false;
      },
    })
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/platform/metrics (GET) - sans auth -> 401/403', () => {
    mockUser = null;
    return request(app.getHttpServer())
      .get('/api/v1/platform/metrics')
      .expect(403);
  });
  
  it('/api/v1/platform/metrics (GET) - user PATRON (isSuperAdmin: false) -> 403', () => {
    mockUser = { userId: '1', role: 'PATRON', isSuperAdmin: false };
    return request(app.getHttpServer())
      .get('/api/v1/platform/metrics')
      .expect(403);
  });

  it('/api/v1/platform/metrics (GET) - user isSuperAdmin: true -> 200', () => {
    mockUser = { userId: '1', role: 'PATRON', isSuperAdmin: true };
    return request(app.getHttpServer())
      .get('/api/v1/platform/metrics')
      .expect(200);
  });
});
