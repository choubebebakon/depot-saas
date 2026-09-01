import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class CreateTourneeWorkflowDto {
  @IsString()
  tricycleId!: string;

  @IsString()
  commercialId!: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}

export class UpdateTourneeWorkflowDto extends CreateTourneeWorkflowDto {}

export class AddTourneeWorkflowLineDto {
  @IsString()
  articleId!: string;

  @IsInt()
  @Min(1)
  quantiteChargee!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  prixUnitaireFacture?: number;
}

export class TourneeReturnLineDto {
  @IsString()
  lineId!: string;

  @IsInt()
  @Min(0)
  quantiteRetourPleins!: number;

  @IsInt()
  @Min(0)
  quantiteRetourVides!: number;
}

export class ReconcileTourneeDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TourneeReturnLineDto)
  lignes!: TourneeReturnLineDto[];

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cashReel!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  orangeMoneyReel!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  mtnMomoReel!: number;
}
