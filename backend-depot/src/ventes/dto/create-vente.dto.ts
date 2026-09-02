import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsOptional,
  IsEnum,
  IsUUID,
  MaxLength,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LigneVenteDto {
  @IsOptional()
  @IsUUID()
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

  /**
   * Prix affiché par le client uniquement pour les cas métier autorisés
   * (conditionnement / casier mixte). Le backend reste la source de vérité.
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  prix?: number;

  @IsOptional()
  @IsUUID()
  conditionnementId?: string;

  @IsOptional()
  @IsBoolean()
  casierMixte?: boolean;

  @IsOptional()
  @IsObject()
  composition?: Record<string, unknown> | unknown[];
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
  @Min(0)
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
  // Compatibilité legacy uniquement. Le scope réel est toujours fourni par
  // le serveur depuis req.depotScope.
  @IsOptional()
  @IsUUID()
  depotId?: string;

  @IsOptional()
  @IsUUID()
  tenantId?: string;

  // UUID client généré avant l'envoi : il sert de clé d'idempotence pour les
  // retries réseau/offline. Il ne constitue jamais une autorité de scope.
  @IsOptional()
  @IsUUID()
  id?: string;

  // Référence externe facultative. Si absente, le backend doit en générer une
  // non séquentielle afin d'éviter les collisions concurrentes de type count+1.
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  reference?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsEnum(ModePaiement)
  modePaiement?: ModePaiement;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montantCash?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montantOM?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montantMoMo?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
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
