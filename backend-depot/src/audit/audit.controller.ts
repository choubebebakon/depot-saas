import { Controller, Get, Query } from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditService } from './audit.service';

@Controller('audit')
@Roles(RoleUser.PATRON)
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Get('journal')
    getJournalPatron(
        @Query('tenantId') tenantId: string,
        @Query('depotId') depotId?: string,
        @Query('action') action?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('limit') limit?: string,
    ) {
        return this.auditService.getJournalPatron(tenantId, {
            depotId,
            action,
            startDate,
            endDate,
            limit: limit ? parseInt(limit, 10) : 100,
        });
    }

    @Get('resume')
    getResume(
        @Query('tenantId') tenantId: string,
        @Query('from') from: string,
        @Query('to') to: string,
    ) {
        return this.auditService.getResume(tenantId, new Date(from), new Date(to));
    }
}
