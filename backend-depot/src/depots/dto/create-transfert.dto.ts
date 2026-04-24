import { IsString, IsNotEmpty, IsArray, ValidateNested, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class LigneTransfertDto {
  @IsString()
  @IsNotEmpty()
  articleId: string;

  @IsInt()
  quantite: number;
}

export class CreateTransfertDto {
  @IsString()
  @IsNotEmpty()
  reference: string;

  @IsString()
  @IsNotEmpty()
  sourceDepotId: string;

  @IsString()
  @IsNotEmpty()
  destDepotId: string;

  @IsString()
  @IsOptional()
  motif?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LigneTransfertDto)
  lignes: LigneTransfertDto[];
}
