import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { CrmChannel } from '@prisma/client';
import {
  CRM_MAX_CHANNEL_ID_LENGTH,
  CRM_MAX_PHONE_LENGTH,
} from '../crm.constants';
import type { JsonObject } from '../crm.types';

/** Format de saisie accepté pour un téléphone (la normalisation est ensuite faite). */
const PHONE_PATTERN = /^[0-9+().\s-]{4,24}$/;

/**
 * Corps de `POST /api/v1/crm/customer/upsert`.
 *
 * `nom` est facultatif : la route de lecture a déjà signalé `found: false`
 * lorsque le nom est inconnu, et l'agent IA le collecte pendant la
 * conversation. En l'absence de nom, le service met simplement à jour les
 * métadonnées d'une fiche existante ; créer une fiche sans nom est refusé
 * (aucun nom de remplacement n'est inventé).
 */
export class UpsertCustomerDto {
  /** Comparé au tenant résolu depuis `x-api-key` ; jamais utilisé pour filtrer. */
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

  @IsOptional()
  @IsEnum(CrmChannel)
  channel?: CrmChannel;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nom?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  depotId?: string;

  /**
   * Patch de métadonnées fusionné structurellement (jamais un remplacement).
   * @IsObject() rejette les tableaux et les scalaires, mais laisse passer des
   * clés arbitraires : c'est voulu, le contenu est borné par le service
   * (profondeur, nombre de clés, taille) et non par un schéma figé.
   */
  @IsOptional()
  @IsObject()
  metaData?: JsonObject;
}