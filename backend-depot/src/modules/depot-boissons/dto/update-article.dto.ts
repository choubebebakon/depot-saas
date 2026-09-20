import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  prixVente?: number;

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
  categorieId?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  codeBarres?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  prixGros?: number;

  @IsOptional()
  @IsString()
  unite?: string;

  @IsOptional()
  @IsBoolean()
  estConsigne?: boolean;
}
