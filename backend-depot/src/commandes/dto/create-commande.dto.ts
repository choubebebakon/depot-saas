import { IsString, IsNotEmpty, IsArray, ValidateNested, IsInt, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class LigneCommandeDto {
  @IsString()
  @IsNotEmpty()
  articleId: string;

  @IsInt()
  quantite: number;

  @IsNumber()
  prixAchatUnit: number;
}

export class CreateCommandeDto {
  @IsString()
  @IsNotEmpty()
  reference: string;

  @IsString()
  @IsNotEmpty()
  fournisseurId: string;

  @IsString()
  @IsNotEmpty()
  depotId: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LigneCommandeDto)
  lignes: LigneCommandeDto[];
}
