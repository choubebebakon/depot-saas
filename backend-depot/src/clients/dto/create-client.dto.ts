import { IsString, IsOptional, IsNumber, Min, MaxLength, Max } from 'class-validator';

/**
 * Création d'un client depuis le back-office (formulaire manuel).
 *
 * Les identifiants de canaux (Instagram / Messenger) sont modifiables ici car
 * un commerçant peut rattacher un client de boutique physique à un compte de
 * messagerie. En revanche `metaData` n'est PAS exposé : ce champ est la propriété
 * exclusive du service CRM (deep merge atomique), pour éviter qu'une édition
 * manuelle n'écrase les enrichissements de l'agent IA.
 */
export class CreateClientDto {
  @IsString()
  @MaxLength(160)
  nom: string;

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

  /** Identifiant Instagram Business (IGSID) — 128 caractères max, comme l'API Meta. */
  @IsOptional()
  @IsString()
  @MaxLength(128)
  instagramId?: string;

  /** Identifiant Facebook Messenger (PSID) — 128 caractères max, comme l'API Meta. */
  @IsOptional()
  @IsString()
  @MaxLength(128)
  messengerId?: string;

  @IsOptional()
  @IsString()
  depotId?: string;
}

