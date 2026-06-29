import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
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
  estConsigne?: boolean;
}

