import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Request } from 'express';
import { tryMetierStubResponse } from '../utils/metier-stub.util';

interface ErrorResponseBody {
  statusCode: number;
  errorCode: string;
  message: string;
  timestamp: string;
  path: string;
}

interface HttpExceptionObjectResponse {
  error?: string;
  errorCode?: string;
  message?: string | string[];
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  /**
   * Convertit toute exception en reponse JSON standardisee pour l'API GeStock.
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const statusCode = this.getStatusCode(exception);
    const response = context.getResponse();

    if (statusCode === HttpStatus.NOT_FOUND && tryMetierStubResponse(request, response)) {
      return;
    }

    const responseBody: ErrorResponseBody = {
      statusCode,
      errorCode: this.getErrorCode(exception),
      message: this.getMessage(exception),
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
    };

    this.logger.error(
      JSON.stringify({
        action: 'http_exception',
        method: request.method,
        path: request.url,
        statusCode: responseBody.statusCode,
        errorCode: responseBody.errorCode,
        message: responseBody.message,
      }),
      exception instanceof Error ? exception.stack : undefined,
    );

    httpAdapter.reply(context.getResponse(), responseBody, statusCode);
  }

  /**
   * Determine le statut HTTP le plus precis possible.
   */
  private getStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return HttpStatus.CONFLICT;
      }

      if (exception.code === 'P2025') {
        return HttpStatus.NOT_FOUND;
      }

      return HttpStatus.BAD_REQUEST;
    }

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return HttpStatus.SERVICE_UNAVAILABLE;
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return HttpStatus.BAD_REQUEST;
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Extrait ou derive un code d'erreur stable pour le frontend.
   */
  private getErrorCode(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'object' && response !== null) {
        const objectResponse = response as HttpExceptionObjectResponse;
        return objectResponse.errorCode ?? objectResponse.error ?? 'HTTP_EXCEPTION';
      }

      return 'HTTP_EXCEPTION';
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return `PRISMA_${exception.code}`;
    }

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return 'PRISMA_INIT_ERROR';
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return 'PRISMA_VALIDATION_ERROR';
    }

    return 'INTERNAL_SERVER_ERROR';
  }

  /**
   * Extrait un message lisible en francais sans exposer les details sensibles.
   */
  private getMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return response;
      }

      if (typeof response === 'object' && response !== null) {
        const objectResponse = response as HttpExceptionObjectResponse;
        const message = objectResponse.message;

        if (Array.isArray(message)) {
          return message.join('; ');
        }

        if (message) {
          return message;
        }
      }
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return 'Une ressource avec cette valeur existe deja.';
      }

      if (exception.code === 'P2025') {
        return 'La ressource demandee est introuvable.';
      }

      return 'Requete base de donnees invalide.';
    }

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return 'Impossible de se connecter a la base de donnees.';
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return 'Donnees de requete invalides pour la base de donnees.';
    }

    return 'Une erreur interne est survenue sur le serveur.';
  }
}
