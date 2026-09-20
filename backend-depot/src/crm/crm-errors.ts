import { HttpStatus } from '@nestjs/common';
import { CRM_ERROR_CODES, type CrmErrorCode } from './crm.constants';

/**
 * Erreur métier du module CRM.
 *
 * Volontairement indépendante de NestJS : le moteur de fusion et les services
 * purs restent testables sans contexte HTTP. Le filtre `CrmExceptionFilter`
 * traduit ensuite `CrmError` en enveloppe JSON uniforme.
 */
export class CrmError extends Error {
  constructor(
    readonly code: CrmErrorCode,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'CrmError';
  }
}

/** Fabriques d'erreurs : garantissent que le code d'erreur reste stable. */
export const crmErrors = {
  validation: (message: string): CrmError =>
    new CrmError(CRM_ERROR_CODES.VALIDATION_ERROR, message, HttpStatus.BAD_REQUEST),

  unauthorized: (message: string): CrmError =>
    new CrmError(CRM_ERROR_CODES.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED),

  channelForbidden: (message: string): CrmError =>
    new CrmError(CRM_ERROR_CODES.CHANNEL_FORBIDDEN, message, HttpStatus.FORBIDDEN),

  /** shopId du body incohérent avec le tenant résolu depuis la clé d'API. */
  tenantMismatch: (message: string): CrmError =>
    new CrmError(CRM_ERROR_CODES.TENANT_MISMATCH, message, HttpStatus.FORBIDDEN),

  nameRequired: (message: string): CrmError =>
    new CrmError(
      CRM_ERROR_CODES.CUSTOMER_NAME_REQUIRED,
      message,
      HttpStatus.BAD_REQUEST,
    ),

  identityConflict: (message: string): CrmError =>
    new CrmError(CRM_ERROR_CODES.IDENTITY_CONFLICT, message, HttpStatus.CONFLICT),

  /** Secret serveur absent : on refuse de servir plutôt que de comparer à vide. */
  notConfigured: (message: string): CrmError =>
    new CrmError(CRM_ERROR_CODES.NOT_CONFIGURED, message, HttpStatus.INTERNAL_SERVER_ERROR),

  internal: (message: string): CrmError =>
    new CrmError(CRM_ERROR_CODES.INTERNAL_ERROR, message, HttpStatus.INTERNAL_SERVER_ERROR),
};