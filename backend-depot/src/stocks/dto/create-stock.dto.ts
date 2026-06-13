import { IsString, IsInt, IsOptional, IsNumber } from 'class-validator';

export class CreateStockDto {
  @IsString()
  articleId: string;

  @IsString()
  depotId: string;

  @IsInt()
  quantite: number;

  @IsOptional()
  @IsInt()
  seuilCritique?: number;

  @IsOptional()
  @IsString()
  tricycleId?: string;
}
