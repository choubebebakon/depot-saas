import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateVehiculeBtpDto {
  @IsString() immatriculation: string;
  @IsString() type: string;
  @IsNumber() capaciteKg: number;
}

export class CreateLivraisonBtpDto {
  @IsString() chantierId: string;
  @IsOptional() @IsString() vehiculeId?: string;
  @IsOptional() @IsString() chauffeur?: string;
  @IsString() reference: string;
}

export class UpdateLivraisonStatutDto {
  @IsString() statut: string;
}
