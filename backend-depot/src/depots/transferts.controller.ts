import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  Request,
} from '@nestjs/common';
import { TransfertsService } from './transferts.service';
import { CreateTransfertDto } from './dto/create-transfert.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { ACCESS_LEVELS } from '../common/utils/rbac';

@Controller('transferts')
export class TransfertsController {
  constructor(private readonly transfertsService: TransfertsService) {}

  @Post()
  @Roles(...ACCESS_LEVELS.GERANT)
  create(
    @Body() dto: CreateTransfertDto,
    @Request() req: any,
  ) {
    const tenantId = req.user?.tenantId;
    return this.transfertsService.createTransfert(dto, tenantId, req.user);
  }

  @Patch(':id/valider')
  @Roles(...ACCESS_LEVELS.GERANT)
  valider(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const tenantId = req.user?.tenantId;
    return this.transfertsService.validerTransfert(id, tenantId, req.user);
  }

  @Get()
  @Roles(...ACCESS_LEVELS.GERANT)
  findAll(@Request() req: any) {
    const tenantId = req.user?.tenantId;
    return this.transfertsService.findAll(tenantId, req.user);
  }

  @Get(':id')
  @Roles(...ACCESS_LEVELS.GERANT)
  findOne(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const tenantId = req.user?.tenantId;
    return this.transfertsService.findOne(id, tenantId, req.user);
  }
}
