import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { CRM_REQUEST_ID_HEADER } from './crm.constants';

/** Charge utile de log : uniquement des scalaires non nominatifs. */
export type CrmLogPayload = Record<
  string,
  string | number | boolean | null | undefined
>;

/** Un identifiant de corrélation entrant n'est accepté que sous cette forme. */
const REQUEST_ID_PATTERN = /^[A-Za-z0-9_.:-]{8,64}$/;

/**
 * Journalisation structurée du module CRM.
 *
 * Deux garanties non négociables :
 *  1. Un `requestId` de bout en bout relie la requête HTTP, la résolution de
 *     clé, la transaction de fusion et la réponse d'erreur.
 *  2. Aucune PII en clair. Les identifiants de canal (téléphone, identifiant
 *     Instagram/Messenger) sont remplacés par une empreinte tronquée
 *     (`subjectRef`) : deux logs du même contact restent corrélables sans
 *     jamais écrire son numéro dans les journaux ou chez l'agrégateur.
 */
@Injectable()
export class CrmLogger {
  private readonly logger = new Logger('CrmOmnichannel');

  /** Sel serveur : sans lui, l'empreinte d'un numéro de 9 chiffres se brute-force. */
  private readonly salt: string;

  constructor() {
    this.salt =
      process.env.CRM_LOG_SUBJECT_SALT ??
      process.env.CRM_API_KEY_PEPPER ??
      'gstock-crm-log-salt';
  }

  /**
   * Identifiant de corrélation : en-tête entrant validé, sinon identifiant
   * généré par le ContextMiddleware, sinon UUID local. L'en-tête entrant est
   * validé par expression régulière : un appelant ne peut pas injecter de
   * contenu arbitraire (retours à la ligne, JSON) dans les journaux.
   */
  resolveRequestId(request: Request | undefined): string {
    const header = request?.headers?.[CRM_REQUEST_ID_HEADER];
    const candidate = Array.isArray(header) ? header[0] : header;

    if (
      typeof candidate === 'string' &&
      REQUEST_ID_PATTERN.test(candidate.trim())
    ) {
      return candidate.trim();
    }

    const generated = (request as { auditRequestId?: unknown })?.auditRequestId;
    if (typeof generated === 'string' && generated.length > 0) {
      return generated;
    }

    return randomUUID();
  }

  /**
   * Empreinte courte et stable d'un identifiant sensible. Sert à corréler
   * plusieurs événements d'un même contact sans exposer la donnée.
   */
  subjectRef(value: string | null | undefined): string {
    if (!value) return 'anonymous';
    return createHash('sha256')
      .update(`${this.salt}:${value}`, 'utf8')
      .digest('hex')
      .slice(0, 12);
  }

  /** Comparaison à temps constant, pour les secrets présentés dans un en-tête. */
  safeEquals(left: string, right: string): boolean {
    const a = Buffer.from(left, 'utf8');
    const b = Buffer.from(right, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }

  info(event: string, payload: CrmLogPayload = {}): void {
    this.write('log', event, payload);
  }

  warn(event: string, payload: CrmLogPayload = {}): void {
    this.write('warn', event, payload);
  }

  error(event: string, payload: CrmLogPayload = {}): void {
    this.write('error', event, payload);
  }

  debug(event: string, payload: CrmLogPayload = {}): void {
    this.write('debug', event, payload);
  }

  private write(
    level: 'log' | 'warn' | 'error' | 'debug',
    event: string,
    payload: CrmLogPayload,
  ): void {
    // Un seul message JSON : les agrégateurs peuvent indexer chaque champ.
    const line = JSON.stringify({
      module: 'crm',
      event,
      timestamp: new Date().toISOString(),
      ...payload,
    });
    this.logger[level](line);
  }
}