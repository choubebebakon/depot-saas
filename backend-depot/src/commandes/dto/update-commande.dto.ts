import { IsOptional, IsEnum, IsString } from 'class-validator';
import { StatutCommande } from '@prisma/client';

export class UpdateCommandeDto {
  @IsOptional()
  @IsEnum(StatutCommande)
  statut?: StatutCommande;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  dateReceptionPrev?: Date;
}
