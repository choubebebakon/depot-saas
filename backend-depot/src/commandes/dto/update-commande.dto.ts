import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { StatutCommande } from '@prisma/client';

export class UpdateCommandeDto {
  @IsOptional()
  @IsEnum(StatutCommande)
  statut?: StatutCommande;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsDateString()
  dateReceptionPrev?: string;
}
