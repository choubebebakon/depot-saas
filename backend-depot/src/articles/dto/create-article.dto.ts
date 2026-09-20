import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty()
  designation: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01) // Le prix doit être > 0
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
}
