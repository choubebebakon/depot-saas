import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CrmChannel } from '@prisma/client';
import {
  CRM_HISTORY_MAX_LIMIT,
  CRM_HISTORY_MIN_LIMIT,
  CRM_MAX_CHANNEL_ID_LENGTH,
  CRM_MAX_PHONE_LENGTH,
} from '../crm.constants';

/** Format de saisie accepté pour un téléphone (la normalisation est ensuite faite). */
const PHONE_PATTERN = /^[0-9+().\s-]{4,24}$/;

/**
 * Corps de `POST /api/v1/crm/customer`.
 *
 * Validation stricte avant toute requête Prisma (ValidationPipe global avec
 * `whitelist: true` : tout champ non déclaré ici est supprimé du body).
 */
export class CustomerQueryDto {
  /**
   * Identifiant du shop tel que connu de l'appelant.
   *
   * ATTENTION : ce champ ne sert JAMAIS à filtrer les données. Il est comparé
   * au tenant résolu depuis `x-api-key` ; toute divergence produit un 403
   * (protection contre une clé mal isolée qui lirait les données d'un autre
   * commerçant).
   */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  shopId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(CRM_MAX_PHONE_LENGTH)
  @Matches(PHONE_PATTERN, { message: 'phoneNumber invalide.' })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(CRM_MAX_CHANNEL_ID_LENGTH)
  instagramId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(CRM_MAX_CHANNEL_ID_LENGTH)
  messengerId?: string;

  /** Canal d'origine du message, si l'orchestrateur le connaît déjà. */
  @IsOptional()
  @IsEnum(CrmChannel)
  channel?: CrmChannel;

  /** Curseur opaque renvoyé par une page précédente. */
  @IsOptional()
  @IsString()
  @MaxLength(256)
  cursor?: string;

  /** Taille de page demandée (bornée par le serveur, défaut issu du shop). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(CRM_HISTORY_MIN_LIMIT)
  @Max(CRM_HISTORY_MAX_LIMIT)
  limit?: number;
}