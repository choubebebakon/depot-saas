import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingCycle, PlanType, PaymentMethod } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import {
  NOTCHPAY_PAYMENT_METHODS,
  normalizeMomoPhoneForCountry,
} from '../../common/config/notchpay-channels.config';
import { MomoPhoneByCountry } from '../../common/validators/momo-phone.constraint';

/**
 * DTO pour la création d'un paiement.
 * Assure-toi que les valeurs envoyées depuis le frontend correspondent
 * exactement aux clés de cet objet.
 */
export class CreatePaymentDto {
  @ApiProperty({
    enum: [PlanType.SOLO, PlanType.PME, PlanType.ENTERPRISE],
    example: PlanType.PME,
    description: 'Plan payant choisi par le tenant.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsEnum(PlanType)
  planPurchased: PlanType;

  @ApiProperty({
    enum: BillingCycle,
    example: BillingCycle.MONTHLY,
    description: 'Cycle de facturation choisi.',
  })
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @ApiProperty({
    enum: NOTCHPAY_PAYMENT_METHODS,
    example: PaymentMethod.MTN_MOMO,
    description:
      "Methode de paiement NotchPay. STRIPE est décommissionné (partie 1) et n'est plus accepté.",
  })
  @IsIn(NOTCHPAY_PAYMENT_METHODS)
  method: PaymentMethod;

  /**
   * PARTIE 2 (contrainte 8) : pays ISO 3166-1 alpha-2 du numéro Mobile Money.
   * Optionnel — défaut CM (seul pays confirmé couvert par NotchPay à ce jour).
   * La validation du numéro se fait contre la config centralisée
   * notchpay-channels.config.ts (fail-closed sur les pays non couverts).
   */
  @ApiPropertyOptional({
    example: 'CM',
    description:
      'Pays du paiement (ISO 3166-1 alpha-2). Défaut : CM. Seuls les pays couverts par NotchPay sont acceptés.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    example: '237670000000',
    description:
      'Numero Mobile Money au format international (237 + 9 chiffres).',
  })
  // PARTIE 3 (contrainte 8) : normalisation pilotée par la config centralisée
  // (indicatif déduit du pays) — plus de '237' codé en dur. Fail-closed : si le
  // pays n'est pas couvert par NotchPay, le numéro n'est pas normalisé et la
  // validation @MomoPhoneByCountry le refuse juste après.
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
  @IsOptional()
  @IsString()
  // PARTIE 3 (contrainte 8) : validation pilotée par la couverture NotchPay
  // réelle (notchpay-channels.config.ts) au lieu de la regex Cameroun-only
  // en dur. Fail-closed : pays non couvert → numéro refusé.
  @MomoPhoneByCountry()
  momoPhoneNumber?: string;

  @ApiPropertyOptional({
    example: 'cm.mtn',
    description:
      'Canal NotchPay souhaite pour ouvrir directement la methode choisie (IDs reels de GET /channels : cm.mtn, cm.orange).',
  })
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional({
    example: 23850,
    description:
      'Montant affiche cote frontend. Le backend recalcule le montant officiel.',
  })
  @IsOptional()
  @IsNumber()
  amount?: number;
}
