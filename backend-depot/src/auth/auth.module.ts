import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaService } from '../prisma.service';
import { PermissionService } from './permission.service';
import { PermissionGuard } from './guards/permission.guard';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret_secure_2026',
      signOptions: { expiresIn: '15m' },
    }),
    AuditModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    PrismaService,
    PermissionService,
    PermissionGuard,
  ],
  exports: [AuthService, JwtModule, PermissionService, PermissionGuard],
})
export class AuthModule {}