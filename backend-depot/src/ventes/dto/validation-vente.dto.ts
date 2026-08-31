import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ValiderSortieVenteDto {
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  depotId?: string;
}

export class AnnulerVenteDto {
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  depotId?: string;

  @IsString()
  @IsNotEmpty()
  motif: string;
}
