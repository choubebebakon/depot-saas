import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDepotDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsNotEmpty()
  adresse: string;

  @IsString()
  @IsNotEmpty()
  emplacement: string;

  @IsString()
  @IsOptional()
  codePrefix?: string;

  @IsString()
  @IsNotEmpty()
  tenantId: string;
}
