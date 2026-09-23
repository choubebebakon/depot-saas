/**
 * Format strict E.164 du numéro transmis à NotchPay (fait validé par le
 * support NotchPay, 2026-09) : TOUJOURS avec '+', selon l'opérateur/pays.
 */
import {
  DEFAULT_COUNTRY_ISO2,
  toE164MomoPhone,
} from './notchpay-channels.config';

describe('toE164MomoPhone (format strict envoyé à NotchPay)', () => {
  it('émet +2376XXXXXXXX pour une saisie locale camerounaise', () => {
    expect(toE164MomoPhone('CM', '670000000')).toBe('+237670000000');
    expect(toE164MomoPhone('CM', '6 70 00 00 00')).toBe('+237670000000');
  });

  it('émet +2376XXXXXXXX pour une saisie déjà internationale, avec ou sans "+"', () => {
    expect(toE164MomoPhone('CM', '237670000000')).toBe('+237670000000');
    expect(toE164MomoPhone('CM', '+237670000000')).toBe('+237670000000');
  });

  it('est fail-closed : pays non couvert, numéro vide ou invalide → undefined', () => {
    expect(toE164MomoPhone('FR', '670000000')).toBeUndefined();
    expect(toE164MomoPhone('CM', '')).toBeUndefined();
    expect(toE164MomoPhone('CM', null)).toBeUndefined();
    expect(toE164MomoPhone('CM', undefined)).toBeUndefined();
    expect(toE164MomoPhone(undefined, '670000000')).toBe('+237670000000'); // défaut CM
  });

  it("n'ajoute JAMAIS de double '+' si la saisie en porte déjà un", () => {
    expect(toE164MomoPhone('CM', '+237670000000')).toBe('+237670000000');
    expect(toE164MomoPhone('CM', '++237670000000')).toBe('+237670000000');
  });

  it("utilise le pays par défaut confirmé (CM) quand aucun pays n'est fourni", () => {
    expect(DEFAULT_COUNTRY_ISO2).toBe('CM');
  });
});
