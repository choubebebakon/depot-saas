import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '@prisma/client';
import { CRM_ERROR_CODES, type CrmErrorCode } from '../crm.constants';
import { CrmError } from '../crm-errors';
import { CrmLogger } from '../crm-logger.service';
import type { CrmAuthenticatedRequest } from '../guards/crm-api-key.guard';
import type { CrmErrorEnvelope } from '../crm.types';

interface MappedError {
  readonly status: number;
  readonly code: CrmErrorCode;
  readonly message: string;
}

/**
 * Enveloppe d'erreur uniforme du CRM :
 * `{ success: false, requestId, error: { code, message } }`.
 *
 * Ce filtre est appliqué au controller (`@UseFilters`) : il prend donc le pas
 * sur le filtre global de l'application, dont le format
 * (`statusCode/errorCode/message`) reste inchangé pour le reste de l'API.
 *
 * Aucun détail interne (message Prisma, stack, identifiant de canal) n'est
 * renvoyé au client : ces éléments restent dans les logs serveur.
 */
@Catch()
export class CrmExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: CrmLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<CrmAuthenticatedRequest>();

    const requestId =
      request.crmRequestId ?? this.logger.resolveRequestId(request);
    const mapped = this.map(exception);

    const body: CrmErrorEnvelope = {
      success: false,
      requestId,
      error: { code: mapped.code, message: mapped.message },
    };

    if (mapped.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error('crm_request_failed', {
        requestId,
        tenantId: request.crmKey?.tenantId ?? null,
        status: mapped.status,
        code: mapped.code,
        reason:
          exception instanceof Error
            ? exception.message
            : 'exception non standard',
      });
    } else {
      this.logger.warn('crm_request_rejected', {
        requestId,
        tenantId: request.crmKey?.tenantId ?? null,
        status: mapped.status,
        code: mapped.code,
      });
    }

    response.status(mapped.status).json(body);
  }

  private map(exception: unknown): MappedError {
    if (exception instanceof CrmError) {
      return {
        status: exception.status,
        code: exception.code,
        message: exception.message,
      };
    }

    if (exception instanceof HttpException) {
      return this.mapHttpException(exception);
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return {
          status: HttpStatus.CONFLICT,
          code: CRM_ERROR_CODES.IDENTITY_CONFLICT,
          message:
            'Cet identifiant est déjà rattaché à une autre fiche client du shop.',
        };
      }

      if (exception.code === 'P2025') {
        return {
          status: HttpStatus.NOT_FOUND,
          code: CRM_ERROR_CODES.NOT_FOUND,
          message: 'Ressource CRM introuvable.',
        };
      }

      return this.internalError();
    }

    return this.internalError();
  }

  private mapHttpException(exception: HttpException): MappedError {
    const status = exception.getStatus();
    const response = exception.getResponse();

    let message = 'Requête CRM invalide.';

    if (typeof response === 'string') {
      message = response;
    } else if (typeof response === 'object' && response !== null) {
      const candidate = response as { message?: unknown };
      const raw = candidate.message;
      if (Array.isArray(raw)) {
        message = raw.filter((item) => typeof item === 'string').join('; ');
      } else if (typeof raw === 'string') {
        message = raw;
      }
    }

    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      return {
        status,
        code: CRM_ERROR_CODES.RATE_LIMITED,
        message:
          'Trop de requêtes CRM : veuillez ralentir les appels de l’agent IA.',
      };
    }

    return {
      status,
      code: this.codeForStatus(status),
      message: status >= HttpStatus.INTERNAL_SERVER_ERROR
        ? 'Une erreur interne est survenue lors du traitement de la demande CRM.'
        : message,
    };
  }

  private codeForStatus(status: number): CrmErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return CRM_ERROR_CODES.VALIDATION_ERROR;
      case HttpStatus.UNAUTHORIZED:
        return CRM_ERROR_CODES.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return CRM_ERROR_CODES.CHANNEL_FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return CRM_ERROR_CODES.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return CRM_ERROR_CODES.IDENTITY_CONFLICT;
      case HttpStatus.TOO_MANY_REQUESTS:
        return CRM_ERROR_CODES.RATE_LIMITED;
      default:
        return CRM_ERROR_CODES.INTERNAL_ERROR;
    }
  }

  private internalError(): MappedError {
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: CRM_ERROR_CODES.INTERNAL_ERROR,
      message:
        'Une erreur interne est survenue lors du traitement de la demande CRM.',
    };
  }
}