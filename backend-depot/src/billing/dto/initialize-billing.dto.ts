import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanType, PaymentMethod } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { normalizeBillingCycle } from '../../common/config/subscription-pricing.config';
import { BillingCycle } from '@prisma/client';
import {
  NOTCHPAY_PAYMENT_METHODS,
  normalizeMomoPhoneForCountry,
} from '../../common/config/notchpay-channels.config';
import { MomoPhoneByCountry } from '../../common/validators/momo-phone.constraint';

export class InitializeBillingDto {
  @ApiProperty({
    enum: [PlanType.SOLO, PlanType.PME, PlanType.ENTERPRISE],
    example: PlanType.PME,
    description: 'Identifiant du plan choisi.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsEnum(PlanType)
  planId: PlanType;

  @ApiProperty({
    example: 'MONTHLY',
    description: 'Cycle de facturation : MONTHLY ou YEARLY (ANNUAL accepté).',
  })
  @Transform(({ value }: { value: unknown }) =>
    normalizeBillingCycle(typeof value === 'string' ? value : 'MONTHLY'),
  )
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  /**
   * PARTIE 1/2 : uniquement les méthodes servibles via NotchPay.
   * STRIPE est explicitement exclu (décommissionnement PARTIE 1, phase 1) :
   * la valeur reste dans l'enum Prisma pour l'historique mais n'est plus
   * acceptée sur ce endpoint.
   */
  @ApiProperty({
    enum: NOTCHPAY_PAYMENT_METHODS,
    example: PaymentMethod.MTN_MOMO,
  })
  @IsIn(NOTCHPAY_PAYMENT_METHODS)
  paymentMethod: PaymentMethod;

  /**
   * PARTIE 2 (contrainte 8) : pays ISO 3166-1 alpha-2 du paiement.
   * Optionnel — défaut CM (seul pays confirmé couvert par le compte
   * NotchPay). Validation canal/numéro contre la config centralisée
   * notchpay-channels.config.ts, fail-closed sur les pays non couverts.
   */
  @ApiPropertyOptional({
    example: 'CM',
    description:
      'Pays du paiement (ISO 3166-1 alpha-2). Défaut : CM. Seuls les pays couverts par NotchPay sont acceptés.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    example: 'cm.mtn',
    description:
      'Canal NotchPay (IDs reels de GET /channels : cm.mtn, cm.orange ; card inactif sur le compte LIVE).',
  })
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional({
    example: '237670000000',
    description:
      'Numéro Mobile Money (optionnel — saisi sur la page NotchPay).',
  })
  @IsOptional()
  @IsString()
  // PARTIE 3 (contrainte 8) : normalisation pilotée par la config centralisée
  // (indicatif déduit du pays) — plus de '237' codé en dur. Fail-closed : pays
  // non couvert → numéro non normalisé puis refusé par @MomoPhoneByCountry.
  @Transform(
    ({ value, obj }: { value: unknown; obj: { country?: string } }) => {
      if (typeof value !== 'string') return value;
      const phone = value.trim();
      if (!phone) return undefined;
      const country =
        typeof obj?.country === 'string'
          ? obj.country.toUpperCase()
          : undefined;
      return normalizeMomoPhoneForCountry(country, phone) ?? phone;
    },
  )
  // PARTIE 3 (contrainte 8) : validation pilotée par la couverture NotchPay
  // réelle (notchpay-channels.config.ts) au lieu de la regex Cameroun-only
  // `^2376\d{8}$` codée en dur. Fail-closed sur les pays non couverts.
  @MomoPhoneByCountry()
  momoPhoneNumber?: string;
}
