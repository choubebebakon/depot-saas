import { Controller, Get, UseGuards } from '@nestjs/common';
import { PlatformAdminService } from './platform-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { AUDIT_ACTIONS } from '../audit/audit-actions.constants';
import { Audit } from '../audit/decorators/audit.decorator';

@Controller('platform')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class PlatformAdminController {
  constructor(private readonly service: PlatformAdminService) {}

  @Get('metrics')
  @Audit('VIEW_PLATFORM_METRICS', 'PlatformAdmin')
  async getMetrics() {
    return this.service.getMetrics();
  }

  @Get('stats')
  @Audit('VIEW_PLATFORM_STATS', 'PlatformAdmin')
  async getStats() {
    return this.service.getLatestStats();
  }
}