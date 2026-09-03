import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditGateway } from './audit.gateway';
import { AuditInterceptor } from './interceptors/audit.interceptor';

const jwtSecret = process.env.JWT_SECRET?.trim() || (
  process.env.NODE_ENV === 'production' ? undefined : 'dev-only-jwt-secret-change-me'
);

if (!jwtSecret) {
  throw new Error('JWT_SECRET est obligatoire en production.');
}

@Module({
  imports: [
    JwtModule.register({
      secret: jwtSecret,
    }),
  ],
  controllers: [AuditController],
  providers: [AuditService, PrismaService, AuditGateway, AuditInterceptor],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}