import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';

/**
 * Transitions valides dans la machine à états des abonnements.
 *
 * TRIAL         → ACTIVE, TRIAL_EXPIRED
 * TRIALING      → ACTIVE, TRIAL_EXPIRED
 * ACTIVE        → PAST_DUE, CANCELED, GRACE
 * PAST_DUE      → ACTIVE, CANCELED, GRACE
 * TRIAL_EXPIRED → ACTIVE, EXPIRED
 * CANCELED      → ACTIVE
 * GRACE         → ACTIVE, EXPIRED
 * EXPIRED       → ACTIVE
 * READ_ONLY     → ACTIVE
 * UNPAID        → ACTIVE, CANCELED
 *
 * ❌ CANCELED/TRIAL_EXPIRED → TRIAL/TRIALING  (interdit)
 */
const VALID_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  [SubscriptionStatus.TRIAL]: [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.TRIAL_EXPIRED,
  ],
  [SubscriptionStatus.TRIALING]: [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.TRIAL_EXPIRED,
  ],
  [SubscriptionStatus.ACTIVE]: [
    SubscriptionStatus.PAST_DUE,
    SubscriptionStatus.CANCELED,
    SubscriptionStatus.GRACE,
  ],
  [SubscriptionStatus.PAST_DUE]: [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.CANCELED,
    SubscriptionStatus.GRACE,
  ],
  [SubscriptionStatus.TRIAL_EXPIRED]: [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.EXPIRED,
  ],
  [SubscriptionStatus.CANCELED]: [
    SubscriptionStatus.ACTIVE,
  ],
  [SubscriptionStatus.GRACE]: [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.EXPIRED,
  ],
  [SubscriptionStatus.EXPIRED]: [
    SubscriptionStatus.ACTIVE,
  ],
  [SubscriptionStatus.READ_ONLY]: [
    SubscriptionStatus.ACTIVE,
  ],
  [SubscriptionStatus.UNPAID]: [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.CANCELED,
  ],
};

/** Statuts qui bloquent l'accès à l'application */
export const BLOCKING_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.TRIAL_EXPIRED,
  SubscriptionStatus.CANCELED,
  SubscriptionStatus.EXPIRED,
  SubscriptionStatus.READ_ONLY,
];

/** Statuts qui permettent l'accès normal */
export const ACTIVE_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.TRIAL,
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.PAST_DUE, // accès maintenu pendant le dunning
  SubscriptionStatus.GRACE,
];

@Injectable()
export class SubscriptionStateMachineService {
  private readonly logger = new Logger(SubscriptionStateMachineService.name);

  /**
   * Valide qu'une transition est autorisée.
   * @throws BadRequestException si la transition est invalide.
   */
  assertValidTransition(
    from: SubscriptionStatus,
    to: SubscriptionStatus,
    context?: string,
  ): void {
    const allowed = VALID_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      const msg = `Transition invalide : ${from} → ${to}${context ? ` (${context})` : ''}`;
      this.logger.error(msg);
      throw new BadRequestException(msg);
    }
    this.logger.debug(`Transition autorisée : ${from} → ${to}`);
  }

  /**
   * Vérifie si une transition est autorisée sans lever d'exception.
   */
  isValidTransition(from: SubscriptionStatus, to: SubscriptionStatus): boolean {
    return (VALID_TRANSITIONS[from] ?? []).includes(to);
  }

  /**
   * Indique si le statut bloque l'accès à l'app.
   */
  isBlocking(status: SubscriptionStatus): boolean {
    return BLOCKING_STATUSES.includes(status);
  }

  /**
   * Indique si le statut permet l'accès normal.
   */
  isActive(status: SubscriptionStatus): boolean {
    return ACTIVE_STATUSES.includes(status);
  }
}
