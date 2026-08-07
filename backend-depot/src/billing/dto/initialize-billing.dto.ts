import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PlanType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { normalizeBillingCycle } from '../../common/config/subscription-pricing.config';
import { BillingCycle } from '@prisma/client';

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
    normalizeBillingCycle(String(value ?? 'MONTHLY')),
  )
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @ApiProperty({
    enum: [
      PaymentMethod.MTN_MOMO,
      PaymentMethod.ORANGE_MONEY,
      PaymentMethod.VISA_CARD,
      PaymentMethod.MASTERCARD,
    ],
    example: PaymentMethod.MTN_MOMO,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    example: 'mtn',
    description: 'Canal NotchPay (mtn, orange, card).',
  })
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional({
    example: '237670000000',
    description: 'Numéro Mobile Money (optionnel — saisi sur la page NotchPay).',
  })
  @IsOptional()
  @IsString()
  @Matches(/^2376\d{8}$/, {
    message: 'Format attendu : 2376XXXXXXXX',
  })
  momoPhoneNumber?: string;
}
