import { PartialType } from '@nestjs/mapped-types';
import { CreateStockDto } from './create-stock.dto';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateStockDto extends PartialType(CreateStockDto) {
  @IsOptional()
  @IsInt()
  quantite?: number;

  @IsOptional()
  @IsInt()
  seuilCritique?: number;

  @IsOptional()
  @IsString()
  tricycleId?: string;
}
