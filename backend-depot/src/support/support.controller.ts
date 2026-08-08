import { Controller, Post, Body, UseGuards, Request, Get, Patch, Param } from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SupportMessageStatut } from '@prisma/client';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';

@UseGuards(JwtAuthGuard)
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('messages')
  async createMessage(@Request() req, @Body() createSupportDto: CreateSupportDto) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    return this.supportService.createMessage(userId, tenantId, createSupportDto);
  }

  @Get('messages')
  async getTenantMessages(@Request() req) {
    const tenantId = req.user.tenantId;
    return this.supportService.getMessagesByTenant(tenantId);
  }

  // --- Admin Routes ---

  @UseGuards(SuperAdminGuard)
  @Get('admin/messages')
  async getAllMessages() {
    return this.supportService.getAllMessages();
  }

  @UseGuards(SuperAdminGuard)
  @Patch('admin/messages/:id/statut')
  async updateStatut(
    @Param('id') id: string,
    @Body() body: { statut: SupportMessageStatut },
  ) {
    return this.supportService.updateStatut(id, body.statut);
  }
}