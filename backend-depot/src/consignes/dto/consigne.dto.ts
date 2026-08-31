import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  Min,
  IsArray,
  ValidateNested,
  IsInt,
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

  @IsNumber()
  @Min(0)
  valeurXAF: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateTypeConsigneDto {
  @IsNumber()
  @Min(0)
  valeurXAF: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class MouvementConsigneDto {
  @IsString()
  typeConsigneId: string;

  @IsInt()
  @Min(1)
  quantite: number;

  @IsBoolean()
  estSortie: boolean;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  venteId?: string;

  @IsOptional()
  @IsString()
  motif?: string;
}

export class RenduSansAchatDto {
  @IsString()
  clientId: string;

  @IsString()
  typeConsigneId: string;

  @IsInt()
  @Min(1)
  quantite: number;

  @IsBoolean()
  estRemboursementCash: boolean;
}

export class VenteConsigneLineDto {
  @IsString()
  typeConsigneId: string;

  @IsInt()
  @Min(0)
  quantiteSortie: number;

  @IsInt()
  @Min(0)
  quantiteRendue: number;
}

export class VenteAvecConsignesDto {
  @IsString()
  venteId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VenteConsigneLineDto)
  lignesConsignes: VenteConsigneLineDto[];

  @IsOptional()
  @IsString()
  clientId?: string;
}
