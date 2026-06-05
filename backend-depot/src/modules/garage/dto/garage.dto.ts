import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVehiculeClientDto {
  @IsString() clientId: string;
  @IsString() immatriculation: string;
  @IsString() marque: string;
  @IsString() modele: string;
  @IsOptional() @IsNumber() annee?: number;
}

export class PieceGarageDto {
  @IsString() designation: string;
  @IsNumber() quantite: number;
  @IsNumber() prix: number;
}

export class CreateFicheTravailDto {
  @IsString() vehiculeId: string;
  @IsString() problemeClient: string;
  @IsOptional() @IsString() travaux?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => PieceGarageDto) pieces?: PieceGarageDto[];
}

export class UpdateFicheStatutDto {
  @IsString() statut: string;
}
