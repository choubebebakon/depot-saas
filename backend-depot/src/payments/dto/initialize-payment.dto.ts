import { IsString, IsNumber, IsEnum, IsEmail, IsNotEmpty } from 'class-validator';

export enum PaymentChannel {
  ORANGE = 'cm.orange',
  MTN = 'cm.mtn',
  CARD = 'card',
}

export enum PlanType {
  SOLO = 'SOLO',
  PME = 'PME',
  PREMIUM = 'PREMIUM',
}

export class InitializePaymentDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(PlanType)
  @IsNotEmpty()
  plan: PlanType;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsEnum(PaymentChannel)
  @IsNotEmpty()
  channel: PaymentChannel;
}
