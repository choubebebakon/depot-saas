import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PlatformAdminController } from './platform-admin.controller';
import { PlatformAdminService } from './platform-admin.service';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [PlatformAdminController],
  providers: [PlatformAdminService, SuperAdminGuard, PrismaService],
})
export class PlatformAdminModule {}