import { PaymentMethod, PaymentStatus } from '@prisma/client';
import {
  CANONICAL_SUCCESS_STATUS,
  canonicalizePaymentStatus,
  canTransitionTo,
} from './payment-status.utils';
import {
  DEFAULT_COUNTRY_ISO2,
  getChannelLimits,
  getCountryCoverage,
  isChannelSupported,
  isPaymentMethodAllowed,
  normalizeMomoPhoneForCountry,
  validateMomoPhoneForCountry,
  NOTCHPAY_PAYMENT_METHODS,
} from '../config/notchpay-channels.config';

/**
 * PARTIE 2/3 — Tests des invariants critiques de la consolidation paiement :
 *  - statut canonique SUCCESS et neutralisation de COMPLETED (contrainte 5) ;
 *  - garde d'idempotence anti double-activation d'abonnement (contrainte 10) ;
 *  - couverture NotchPay fail-closed (contrainte 8) — un pays non confirmé
 *    n'est JAMAIS accepté, y compris par défaut ;
 *  - STRIPE exclu des méthodes servibles (contrainte 4).
 */
describe('payment-status.utils — statut canonique & idempotence', () => {
  it('expose SUCCESS comme statut canonique de succès', () => {
    expect(CANONICAL_SUCCESS_STATUS).toBe(PaymentStatus.SUCCESS);
  });

  it('réinterprète le statut historique COMPLETED vers SUCCESS', () => {
    expect(canonicalizePaymentStatus(PaymentStatus.COMPLETED)).toBe(
      PaymentStatus.SUCCESS,
    );
    expect(canonicalizePaymentStatus('completed')).toBe(PaymentStatus.SUCCESS);
  });

  it('laisse les statuts non dépréciés inchangés (insensible à la casse)', () => {
    expect(canonicalizePaymentStatus('pending')).toBe(PaymentStatus.PENDING);
    expect(canonicalizePaymentStatus('FAILED')).toBe(PaymentStatus.FAILED);
    expect(canonicalizePaymentStatus(null)).toBeUndefined();
  });

  it('refuse toute re-mutation depuis un statut terminal (anti replay webhook)', () => {
    // Un paiement déjà abouti ne peut plus être re-confirmé ni échoué.
    expect(canTransitionTo(PaymentStatus.SUCCESS, PaymentStatus.SUCCESS)).toBe(
      false,
    );
    expect(canTransitionTo(PaymentStatus.SUCCESS, PaymentStatus.FAILED)).toBe(
      false,
    );
    expect(
      canTransitionTo(PaymentStatus.COMPLETED, PaymentStatus.SUCCESS),
    ).toBe(false);
    // Un remboursement est figé et reste le seul successeur d'un succès.
    expect(canTransitionTo(PaymentStatus.REFUNDED, PaymentStatus.SUCCESS)).toBe(
      false,
    );
    expect(canTransitionTo(PaymentStatus.SUCCESS, PaymentStatus.REFUNDED)).toBe(
      true,
    );
  });

  it('autorise les transitions légitimes depuis PENDING / FAILED', () => {
    expect(canTransitionTo(PaymentStatus.PENDING, PaymentStatus.SUCCESS)).toBe(
      true,
    );
    expect(canTransitionTo(PaymentStatus.PENDING, PaymentStatus.FAILED)).toBe(
      true,
    );
    // Retry opérateur légitime sur un paiement précédemment échoué.
    expect(canTransitionTo(PaymentStatus.FAILED, PaymentStatus.SUCCESS)).toBe(
      true,
    );
  });
});

describe('notchpay-channels.config — couverture réelle & fail-closed', () => {
  it('ne liste que le Cameroun et exclut STRIPE des méthodes servibles', () => {
    expect(DEFAULT_COUNTRY_ISO2).toBe('CM');
    expect(getCountryCoverage('CM')?.currency).toBe('XAF');
    expect(NOTCHPAY_PAYMENT_METHODS).not.toContain(PaymentMethod.STRIPE);
  });

  it('refuse un pays non confirmé (fail-closed, jamais de pays supposé)', () => {
    expect(getCountryCoverage('FR')).toBeUndefined();
    expect(isPaymentMethodAllowed('FR', PaymentMethod.VISA_CARD)).toBe(false);
    expect(isChannelSupported('FR', 'card')).toBe(false);
    expect(validateMomoPhoneForCountry('FR', '237670000000')).toBe(false);
    expect(normalizeMomoPhoneForCountry('FR', '670000000')).toBeUndefined();
  });

  it('valide les canaux réellement confirmés sur le compte NotchPay (GET /channels, compte LIVE)', () => {
    // IDs RÉELS de GET /channels (FAIT VALIDÉ n°6) : cm.mtn / cm.orange.
    expect(isChannelSupported('CM', 'cm.mtn')).toBe(true);
    expect(isChannelSupported('CM', 'cm.orange')).toBe(true);
    // Canal carte INACTIF sur le compte (active=false, live=false) → refusé.
    expect(isChannelSupported('CM', 'card')).toBe(false);
    // Ancien slug suffixe ('mtn') sans préfixe pays → plus accepté.
    expect(isChannelSupported('CM', 'mtn')).toBe(false);
    // Canal inexistant → refusé.
    expect(isChannelSupported('CM', 'paypal')).toBe(false);
    expect(isPaymentMethodAllowed('CM', PaymentMethod.MTN_MOMO)).toBe(true);
    expect(isPaymentMethodAllowed('CM', PaymentMethod.STRIPE)).toBe(false);
    // Carte inactive → méthode carte refusée (fail-closed).
    expect(isPaymentMethodAllowed('CM', PaymentMethod.VISA_CARD)).toBe(false);
  });

  it('expose les limites de montant réelles des canaux MoMo CM (min 10 / max 500 000 XAF)', () => {
    expect(getChannelLimits('CM', 'cm.mtn')).toEqual({
      minAmount: 10,
      maxAmount: 500_000,
    });
    expect(getChannelLimits('CM', 'cm.orange')?.maxAmount).toBe(500_000);
    // Canal carte : pas de limites exposées tant que le canal est inactif.
    expect(getChannelLimits('CM', 'card')).toEqual({
      minAmount: undefined,
      maxAmount: undefined,
    });
    // Pays/canal inconnus → undefined (l'appelant décide du repli).
    expect(getChannelLimits('FR', 'cm.mtn')).toBeUndefined();
    expect(getChannelLimits('CM', 'paypal')).toBeUndefined();
  });

  it('valide et normalise les numéros Mobile Money du pays couvert', () => {
    expect(validateMomoPhoneForCountry('CM', '237670000000')).toBe(true);
    expect(validateMomoPhoneForCountry('CM', '237 670 000 000')).toBe(true);
    // Numéro local (sans indicatif) → préfixé par l'indicatif du pays.
    expect(normalizeMomoPhoneForCountry('CM', '670000000')).toBe(
      '237670000000',
    );
    // Numéro déjà international → conservé tel quel (pas de double préfixe).
    expect(normalizeMomoPhoneForCountry('CM', '237670000000')).toBe(
      '237670000000',
    );
    // Format invalide → rejeté.
    expect(validateMomoPhoneForCountry('CM', '12345')).toBe(false);
  });
});
