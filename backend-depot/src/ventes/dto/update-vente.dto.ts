import { IsString, IsOptional, IsEnum } from 'class-validator';
import { StatutVente, ModePaiement } from '@prisma/client';

export class UpdateVenteDto {
  @IsOptional()
  @IsEnum(StatutVente)
  statut?: StatutVente;

  @IsOptional()
  @IsString()
  motifAnnulation?: string;

  @IsOptional()
  @IsEnum(ModePaiement)
  modePaiement?: ModePaiement;
}
