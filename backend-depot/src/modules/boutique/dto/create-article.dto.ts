import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsNotEmpty,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty()
  designation: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  prixVente: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  prixAchat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  seuilCritique?: number;

  @IsOptional()
  @IsString()
  familleId?: string;

  @IsOptional()
  @IsString()
  marqueId?: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  prixBouteille?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  margeBouteille?: number;

  @IsOptional()
  @IsBoolean()
  estConsigne?: boolean;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  codeBarres?: string;

  @IsOptional()
  @IsString()
  unite?: string;

  @IsOptional()
  @IsString()
  categorieId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  prixGros?: number;

  /** Type de famille en TEXTE LIBRE — résolu (find-or-create) par le service. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  familleNom?: string;

  /** Date et heure de péremption de l'article, transmises en ISO 8601. */
  @IsOptional()
  @IsDateString()
  datePeremption?: string;

  @IsOptional()
  @IsString()
  depotId?: string;
}
