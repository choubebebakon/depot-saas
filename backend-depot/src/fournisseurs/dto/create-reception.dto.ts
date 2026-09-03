import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ModePaiement } from '@prisma/client';

const UNITES_RECEPTION = [
  'PIECE',
  'BOUTEILLE',
  'CASIER',
  'PACK',
  'PALETTE',
  'PLATEAU',
] as const;

export class LigneReceptionDto {
  @IsString()
  @MaxLength(100)
  articleId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantiteLivree: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantiteGratuite: number = 0;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  prixAchatUnitaire: number;

  @IsOptional()
  @IsString()
  @IsIn(UNITES_RECEPTION)
  unite?: (typeof UNITES_RECEPTION)[number];
}

export class CreateReceptionDto {
  @IsString()
  @MaxLength(100)
  fournisseurId: string;

  @IsEnum(ModePaiement)
  modePaiement: ModePaiement;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montantPaye: number = 0;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => LigneReceptionDto)
  lignes: LigneReceptionDto[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  numBordereau?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
