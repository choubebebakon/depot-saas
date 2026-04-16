import {
  IsString, IsNotEmpty, IsArray, ValidateNested,
  IsNumber, Min, IsOptional, IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LigneVenteDto {
  @IsString()
  @IsNotEmpty()
  articleId: string;

  @IsNumber()
  @Min(1)
  quantite: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  remise?: number;
}

export enum ModePaiement {
  CASH = 'CASH',
  ORANGE_MONEY = 'ORANGE_MONEY',
  MTN_MOMO = 'MTN_MOMO',
  CREDIT = 'CREDIT',
  MIXTE = 'MIXTE',
}

export class CreateVenteDto {
  @IsString()
  @IsNotEmpty()
  siteId: string;

  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsEnum(ModePaiement)
  modePaiement?: ModePaiement;

  // Ventilation des montants (si paiement mixte ou précis)
  @IsOptional()
  @IsNumber()
  montantCash?: number;

  @IsOptional()
  @IsNumber()
  montantOM?: number;

  @IsOptional()
  @IsNumber()
  montantMoMo?: number;

  @IsOptional()
  @IsNumber()
  montantCredit?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LigneVenteDto)
  lignes: LigneVenteDto[];
}
