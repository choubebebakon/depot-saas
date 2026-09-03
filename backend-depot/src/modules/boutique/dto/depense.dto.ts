import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum DepenseCategorieEnum {
  ACHATS = 'ACHATS',
  LOYER = 'LOYER',
  ELECTRICITE = 'ELECTRICITE',
  AUTRE = 'AUTRE',
}

export class DepenseQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @IsUUID()
  depotId?: string;

  @IsOptional()
  @IsEnum(DepenseCategorieEnum)
  categorie?: DepenseCategorieEnum;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}

export class CreateDepenseDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(1000000000)
  montant!: number;

  @IsOptional()
  @IsEnum(DepenseCategorieEnum)
  categorie?: DepenseCategorieEnum;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  libelle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  motif?: string;
}

export class UpdateDepenseDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(1000000000)
  montant?: number;

  @IsOptional()
  @IsEnum(DepenseCategorieEnum)
  categorie?: DepenseCategorieEnum;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  libelle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  motif?: string;
}
