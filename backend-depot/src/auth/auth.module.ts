import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AppleAuthController } from './apple-auth.controller';
import { AppleAuthService } from './apple-auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaService } from '../prisma.service';
import { PermissionService } from './permission.service';
import { PermissionGuard } from './guards/permission.guard';
import { AuditModule } from '../audit/audit.module';

const jwtSecret = process.env.JWT_SECRET?.trim() || (
  process.env.NODE_ENV === 'production' ? undefined : 'dev-only-jwt-secret-change-me'
);

if (!jwtSecret) {
  throw new Error('JWT_SECRET est obligatoire en production.');
}

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: '15m' },
    }),
    AuditModule,
  ],
  controllers: [AuthController, AppleAuthController],
  providers: [
    AuthService,
    AppleAuthService,
    JwtStrategy,
    PrismaService,
    PermissionService,
    PermissionGuard,
  ],
  exports: [AuthService, JwtModule, PermissionService, PermissionGuard],
})
export class AuthModule {}