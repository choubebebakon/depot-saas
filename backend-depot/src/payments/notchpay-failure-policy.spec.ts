import {
  classifyNotchPayFailure,
  retryTransient,
  NOTCHPAY_CLIENT_MESSAGES,
} from './notchpay-failure-policy';

/**
 * Tests de la politique d'échec NotchPay (transitoire vs définitif) :
 *  - classification à partir du code HTTP / message brut de l'agrégateur ;
 *  - messages marchands dédiés (jamais le message technique brut) ;
 *  - retry automatique avec backoff exponentiel pour les seuls transitoires.
 */
describe('classifyNotchPayFailure — catégories d\u2019échec', () => {
  it('« Service Unavailable » sur le champ phone (fait validé) → TRANSIENT, retryable, message dédié', () => {
    const result = classifyNotchPayFailure(
      422,
      'Service Unavailable for this phone number',
    );
    expect(result.category).toBe('TRANSIENT');
    expect(result.retryable).toBe(true);
    expect(result.clientMessage).toBe(NOTCHPAY_CLIENT_MESSAGES.TRANSIENT);
  });

  it('codes HTTP transitoires (500/502/503/504/429/408) → TRANSIENT', () => {
    for (const status of [408, 425, 429, 500, 502, 503, 504]) {
      expect(classifyNotchPayFailure(status, 'Unexpected error').category).toBe(
        'TRANSIENT',
      );
    }
  });

  it('erreur réseau (ECONNRESET / timeout) → TRANSIENT', () => {
    expect(
      classifyNotchPayFailure(undefined, 'Request failed with code ECONNRESET')
        .category,
    ).toBe('TRANSIENT');
    expect(
      classifyNotchPayFailure(undefined, 'timeout of 20000ms exceeded')
        .category,
    ).toBe('TRANSIENT');
  });

  it('numéro invalide → INVALID_NUMBER, NON retryable', () => {
    for (const message of [
      'Invalid phone number',
      'Numéro invalide pour cet opérateur',
      'Invalid MSISDN provided',
    ]) {
      const result = classifyNotchPayFailure(422, message);
      expect(result.category).toBe('INVALID_NUMBER');
      expect(result.retryable).toBe(false);
      expect(result.clientMessage).toBe(
        NOTCHPAY_CLIENT_MESSAGES.INVALID_NUMBER,
      );
    }
  });

  it('fonds insuffisants → INSUFFICIENT_FUNDS, NON retryable', () => {
    const result = classifyNotchPayFailure(400, 'Insufficient balance');
    expect(result.category).toBe('INSUFFICIENT_FUNDS');
    expect(result.retryable).toBe(false);
    expect(result.clientMessage).toBe(
      NOTCHPAY_CLIENT_MESSAGES.INSUFFICIENT_FUNDS,
    );
  });

  it('annulé / expiré sans validation → ABANDONED (message honnête)', () => {
    for (const message of ['Transaction canceled', 'Payment expired']) {
      const result = classifyNotchPayFailure(400, message);
      expect(result.category).toBe('ABANDONED');
      expect(result.clientMessage).toBe(NOTCHPAY_CLIENT_MESSAGES.ABANDONED);
    }
  });

  it('erreur non catégorisée → UNKNOWN, message neutre, jamais le brut', () => {
    const result = classifyNotchPayFailure(422, 'weird-provider-code-42');
    expect(result.category).toBe('UNKNOWN');
    expect(result.retryable).toBe(false);
    expect(result.clientMessage).toBe(NOTCHPAY_CLIENT_MESSAGES.UNKNOWN);
    expect(result.clientMessage).not.toContain('weird-provider-code-42');
  });
});

describe('retryTransient — backoff exponentiel sur les seuls transitoires', () => {
  it('réessaie les échecs transitoires puis réussit', async () => {
    jest.useFakeTimers();
    let attempts = 0;
    // Tâche NON async : rejette/résout sans `await` interne (sinon la règle
    // require-await du linter signalerait une fausse promesse jamais attendue).
    const task = jest.fn(() =>
      ++attempts < 3
        ? Promise.reject(new Error('Service Unavailable'))
        : Promise.resolve('OK'),
    );

    const promise = retryTransient(task, () => true, [500, 1500]);
    await jest.advanceTimersByTimeAsync(2500);
    await expect(promise).resolves.toBe('OK');
    expect(attempts).toBe(3);
    jest.useRealTimers();
  });

  it('ne réessaie PAS un échec définitif (numéro invalide)', async () => {
    const task = jest.fn(() =>
      Promise.reject(new Error('Invalid phone number')),
    );

    await expect(retryTransient(task, () => false, [500])).rejects.toThrow(
      'Invalid phone number',
    );
    expect(task).toHaveBeenCalledTimes(1);
  });
});
