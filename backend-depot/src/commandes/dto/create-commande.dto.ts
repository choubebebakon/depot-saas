import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class LigneCommandeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  articleId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantite: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  prixAchatUnit: number;
}

export class CreateCommandeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  reference: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fournisseurId: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LigneCommandeDto)
  lignes: LigneCommandeDto[];
}
