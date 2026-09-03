import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  Min,
  Max,
  IsArray,
  ArrayMaxSize,
  ValidateNested,
  IsInt,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TypeConsigneEnum {
  BOUTEILLE_33CL = 'BOUTEILLE_33CL',
  BOUTEILLE_60CL = 'BOUTEILLE_60CL',
  CASIER = 'CASIER',
  PALETTE = 'PALETTE',
  PACK_EAU = 'PACK_EAU',
}

export class CreateTypeConsigneDto {
  @IsEnum(TypeConsigneEnum)
  type: TypeConsigneEnum;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000000)
  valeurXAF: number;

  @IsOptional()
  @IsString()
  @Max(500)
  description?: string;
}

export class UpdateTypeConsigneDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000000)
  valeurXAF: number;

  @IsOptional()
  @IsString()
  @Max(500)
  description?: string;
}

export class MouvementConsigneDto {
  @IsUUID()
  typeConsigneId: string;

  @IsInt()
  @Min(1)
  @Max(1000000)
  quantite: number;

  @IsBoolean()
  estSortie: boolean;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  venteId?: string;

  @IsOptional()
  @IsString()
  @Max(500)
  motif?: string;
}

export class RenduSansAchatDto {
  @IsUUID()
  clientId: string;

  @IsUUID()
  typeConsigneId: string;

  @IsInt()
  @Min(1)
  @Max(1000000)
  quantite: number;

  @IsBoolean()
  estRemboursementCash: boolean;
}

export class VenteConsigneLineDto {
  @IsUUID()
  typeConsigneId: string;

  @IsInt()
  @Min(0)
  @Max(1000000)
  quantiteSortie: number;

  @IsInt()
  @Min(0)
  @Max(1000000)
  quantiteRendue: number;
}

export class VenteAvecConsignesDto {
  @IsUUID()
  venteId: string;

  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => VenteConsigneLineDto)
  lignesConsignes: VenteConsigneLineDto[];

  @IsOptional()
  @IsUUID()
  clientId?: string;
}
