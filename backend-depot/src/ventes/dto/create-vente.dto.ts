import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LigneVenteDto {
  @IsOptional()
  @IsString()
  id?: string;

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

  @IsOptional()
  @IsNumber()
  @Min(0)
  prix?: number;

  @IsOptional()
  @IsString()
  conditionnementId?: string;

  @IsOptional()
  casierMixte?: boolean;

  @IsOptional()
  composition?: any;
}

export class RetourConsigneDto {
  @IsString()
  @IsNotEmpty()
  typeConsigneId: string;

  @IsNumber()
  @Min(1)
  quantite: number;

  @IsOptional()
  @IsNumber()
  valeurUnitaire?: number;
}

export enum ModePaiement {
  CASH = 'CASH',
  ORANGE_MONEY = 'ORANGE_MONEY',
  MTN_MOMO = 'MTN_MOMO',
  CREDIT = 'CREDIT',
  MIXTE = 'MIXTE',
}

export class CreateVenteDto {
  // Ces deux champs sont optionnels uniquement pour compatibilité avec les
  // anciens clients. Ils ne constituent jamais une preuve d'identité/scope :
  // le controller remplace leurs valeurs par le contexte authentifié.
  @IsOptional()
  @IsString()
  depotId?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsEnum(ModePaiement)
  modePaiement?: ModePaiement;

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RetourConsigneDto)
  retoursConsigne?: RetourConsigneDto[];
}
