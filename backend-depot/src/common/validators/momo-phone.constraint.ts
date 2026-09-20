import {
  registerDecorator,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { validateMomoPhoneForCountry } from '../config/notchpay-channels.config';

/**
 * PARTIE 3 (contrainte 8) — Validation de numéro Mobile Money pilotée par la
 * couverture NotchPay réelle (src/common/config/notchpay-channels.config.ts),
 * en remplacement de la regex Cameroun-only `^2376\d{8}$` codée en dur.
 *
 * Le pays est lu sur le champ `country` du même DTO (optionnel, défaut CM).
 * Fail-closed : un pays non couvert par NotchPay refuse tout numéro.
 */
@ValidatorConstraint({ name: 'momoPhoneByCountry', async: false })
export class MomoPhoneByCountryConstraint implements ValidatorConstraintInterface {
  validate(phone: string, args: ValidationArguments): boolean {
    if (phone == null || phone === '') return true; // champ optionnel
    const country = (args.object as { country?: string })?.country;
    return validateMomoPhoneForCountry(country, phone);
  }

  defaultMessage(args: ValidationArguments): string {
    const country =
      (args.object as { country?: string })?.country ?? 'CM (défaut)';
    return `Numéro Mobile Money invalide pour le pays ${country}. Le pays doit être couvert par NotchPay (format international : indicatif + numéro).`;
  }
}

export function MomoPhoneByCountry() {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      constraints: [],
      validator: MomoPhoneByCountryConstraint,
    });
  };
}
