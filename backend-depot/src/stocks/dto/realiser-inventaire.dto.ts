import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LigneInventaireDto {
  @IsUUID()
  articleId: string;

  @IsInt()
  @Min(0)
  quantiteComptee: number;
}

export class RealiserInventaireDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => LigneInventaireDto)
  lignes: LigneInventaireDto[];

  @IsOptional()
  @IsString()
  motif?: string;
}
