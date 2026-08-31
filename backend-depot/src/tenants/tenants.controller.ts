import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { Request } from 'express';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    tenantId: string;
    depotId: string | null;
  };
}

@Controller('tenant')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Public()
  @Post()
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Roles(RoleUser.PATRON, RoleUser.GERANT)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.tenantsService.update(id, updateTenantDto, req.user);
  }

  @Roles(
    RoleUser.PATRON,
    RoleUser.GERANT,
    RoleUser.CAISSIER,
    RoleUser.MAGASINIER,
    RoleUser.COMMERCIAL,
    RoleUser.COMPTABLE,
  )
  @Get('info')
  getInfo(@Req() req: AuthenticatedRequest) {
    return this.tenantsService.getInfo(req.user);
  }

  @Roles(RoleUser.PATRON, RoleUser.GERANT)
  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.tenantsService.findAll(req.user?.tenantId);
  }

  @Roles(RoleUser.PATRON, RoleUser.GERANT)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.tenantsService.findOne(id, req.user?.tenantId);
  }
}
