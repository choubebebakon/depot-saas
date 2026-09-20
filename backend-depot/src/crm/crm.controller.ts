import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { CrmApiKeyService } from './crm-api-key.service';
import { CrmCustomerService } from './crm-customer.service';
import {
  CRM_API_KEY_HEADER,
  CRM_META_SIGNATURE_HEADER,
  CRM_REQUEST_ID_HEADER,
} from './crm.constants';
import { CrmLogger } from './crm-logger.service';
import { resolveExtraIdentifiers, resolveIdentifier } from './crm-identifier';
import { CrmService } from './crm-service';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { UpsertCustomerDto } from './dto/upsert-customer.dto';
import { CrmExceptionFilter } from './filters/crm-exception.filter';
import {
  CrmApiKeyGuard,
  requireCrmKey,
  type CrmAuthenticatedRequest,
} from './guards/crm-api-key.guard';
import type {
  CrmCustomerLookup,
  CrmEnvelope,
  UpsertCustomerResult,
} from './crm.types';

/** Limites de débit par instance (le ThrottlerGuard global s'applique en plus). */
const CRM_READ_RATE_LIMIT = { default: { limit: 120, ttl: 60_000 } };
const CRM_WRITE_RATE_LIMIT = { default: { limit: 60, ttl: 60_000 } };

/**
 * API CRM omnicanale (resource server machine-à-machine).
 *
 * Authentification : `x-api-key` (résolue en tenantId). Aucun JWT : l'agent IA
 * conversationnel et l'orchestrateur de webhooks ne sont pas des utilisateurs
 * du back-office. `@Public()` neutralise donc les guards JWT/rôles/permissions
 * globaux, et `CrmApiKeyGuard` prend le relais.
 *
 * Isolation : le tenant est TOUJOURS celui de la clé. Un `shopId` de body
 * différent est rejeté en 403 par le guard.
 */
@ApiTags('CRM Omnicanal')
@Controller('crm')
@Public()
@UseGuards(CrmApiKeyGuard)
@UseFilters(CrmExceptionFilter)
export class CrmController {
  constructor(
    private readonly customers: CrmCustomerService,
    private readonly crm: CrmService,
    private readonly apiKeys: CrmApiKeyService,
    private readonly logger: CrmLogger,
  ) {}

  @Post('customer')
  @HttpCode(HttpStatus.OK)
  @Throttle(CRM_READ_RATE_LIMIT)
  @ApiHeader({ name: CRM_API_KEY_HEADER, required: true })
  @ApiHeader({ name: CRM_REQUEST_ID_HEADER, required: false })
  @ApiOperation({
    summary:
      "Recherche d'un client final par identifiant de canal (WhatsApp / Instagram / Messenger)",
  })
  @ApiResponse({ status: 200, description: 'found: true | false' })
  @ApiResponse({ status: 403, description: 'shopId incohérent avec la clé' })
  async customer(
    @Body() dto: CustomerQueryDto,
    @Req() request: CrmAuthenticatedRequest,
  ): Promise<CrmEnvelope<CrmCustomerLookup>> {
    const key = requireCrmKey(request);
    const requestId = requireRequestId(request, this.logger);

    const identifier = resolveIdentifier({
      phoneNumber: dto.phoneNumber,
      instagramId: dto.instagramId,
      messengerId: dto.messengerId,
      channel: dto.channel,
    });

    this.apiKeys.assertChannelAllowed(key, identifier.channel, requestId);

    const data = await this.customers.findCustomer({
      tenantId: key.tenantId,
      identifier,
      limit: dto.limit,
      cursor: dto.cursor,
      requestId,
    });

    return { success: true, requestId, data };
  }

  @Post('customer/upsert')
  @HttpCode(HttpStatus.OK)
  @Throttle(CRM_WRITE_RATE_LIMIT)
  @ApiHeader({ name: CRM_API_KEY_HEADER, required: true })
  @ApiHeader({ name: CRM_META_SIGNATURE_HEADER, required: false })
  @ApiHeader({ name: CRM_REQUEST_ID_HEADER, required: false })
  @ApiOperation({
    summary:
      "Création / enrichissement d'une fiche client depuis l'agent IA (fusion metaData)",
  })
  @ApiResponse({ status: 200, description: 'Fiche créée ou fusionnée' })
  @ApiResponse({ status: 400, description: 'Nom requis pour un nouveau contact' })
  @ApiResponse({ status: 403, description: 'shopId incohérent avec la clé' })
  @ApiResponse({ status: 409, description: 'Identifiant déjà rattaché' })
  async upsert(
    @Body() dto: UpsertCustomerDto,
    @Req() request: CrmAuthenticatedRequest,
  ): Promise<CrmEnvelope<UpsertCustomerResult>> {
    const key = requireCrmKey(request);
    const requestId = requireRequestId(request, this.logger);

    const raw = {
      phoneNumber: dto.phoneNumber,
      instagramId: dto.instagramId,
      messengerId: dto.messengerId,
      channel: dto.channel,
    };

    const identifier = resolveIdentifier(raw);
    this.apiKeys.assertChannelAllowed(key, identifier.channel, requestId);

    const data = await this.crm.upsertCustomerFromIA({
      tenantId: key.tenantId,
      identifier,
      extraIdentifiers: resolveExtraIdentifiers(raw, identifier),
      displayName: dto.nom,
      depotId: dto.depotId ?? null,
      metaDataPatch: dto.metaData,
      requestId,
    });

    return { success: true, requestId, data };
  }
}

/** Le requestId est posé par le guard ; on refuse de journaliser sans lui. */
function requireRequestId(
  request: CrmAuthenticatedRequest,
  logger: CrmLogger,
): string {
  return request.crmRequestId ?? logger.resolveRequestId(request);
}