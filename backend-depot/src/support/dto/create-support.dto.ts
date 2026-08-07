import { IsString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { SupportMessageType } from '@prisma/client';

export class CreateSupportDto {
  @IsNotEmpty({ message: 'Le message ne peut pas être vide' })
  @IsString()
  message: string;

  @IsEnum(SupportMessageType, { message: 'Type de message invalide (BUG, SUGGESTION, MESSAGE)' })
  type: SupportMessageType;

  @IsOptional()
  @IsString()
  pageUrl?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}