import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingCycle, PaymentMethod, PlanType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Matches } from 'class-validator';

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
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
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
    enum: [
      PaymentMethod.ORANGE_MONEY, 
      PaymentMethod.MTN_MOMO, 
      PaymentMethod.VISA_CARD, 
      PaymentMethod.MASTERCARD
    ],
    example: PaymentMethod.MTN_MOMO,
    description: 'Methode de paiement NotchPay.',
  })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({
    example: '237670000000',
    description: 'Numero Mobile Money au format international (237 + 9 chiffres).',
  })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;

    const phone = value.trim();
    if (!phone) return undefined;

    return /^6\d{8}$/.test(phone) ? `237${phone}` : phone;
  })
  @IsOptional()
  @IsString()
  // Regex assouplie : vérifie que ça commence par 2376 et possède 8 chiffres derrière
  @Matches(/^2376\d{8}$/, {
    message: 'Le numéro doit être au format international : 2376XXXXXXXX (ex: 237670000000).',
  })
  momoPhoneNumber?: string;

  @ApiPropertyOptional({
    example: 'mtn',
    description: 'Canal NotchPay souhaite pour ouvrir directement la methode choisie.',
  })
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional({
    example: 23850,
    description: 'Montant affiche cote frontend. Le backend recalcule le montant officiel.',
  })
  @IsOptional()
  @IsNumber()
  amount?: number;
}
