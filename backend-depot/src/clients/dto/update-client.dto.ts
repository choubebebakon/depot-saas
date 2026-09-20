import { IsString, IsOptional, IsNumber, Min, MaxLength } from 'class-validator';

/**
 * Mise à jour d'un client depuis le back-office.
 *
 * Convention du module (alignée sur le service existant) : une chaîne vide
 * `''` signifie « effacer la valeur », `undefined` signifie « ne pas toucher ».
 * `metaData` volontairement absent : réservé au service CRM.
 */
export class UpdateClientDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  nom?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  telephone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  adresse?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  plafondCredit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  instagramId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  messengerId?: string;
}
