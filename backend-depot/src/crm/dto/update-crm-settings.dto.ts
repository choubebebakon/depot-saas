import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Bornes techniques de saisie (plages de validité), indépendantes de tout
 * métier : elles interdisent l'absurde (ratio négatif, seuil > 100 %) sans
 * jamais choisir une règle métier à la place du commerçant.
 */
const CRM_SETTINGS_INPUT_BOUNDS = {
  /** Ratio points gagnés par unité monétaire dépensée. */
  pointsPerCurrencyUnit: { min: 0, max: 1_000_000 },
  /** Ratio de conversion points -> monnaie. */
  pointsToCurrencyRatio: { min: 0, max: 1_000_000 },
  /** Seuil d'écart de stock déclenchant l'alerte perte/vol (%). */
  maxDeltaPercent: { min: 0, max: 100 },
  /** Fenêtre glissante du calcul d'écart (jours). */
  windowDays: { min: 1, max: 365 },
} as const;

/**
 * Paramètres CRM métier d'un shop (contrainte n°12/13).
 *
 * DTO aplati, volontairement aligné sur les champs du formulaire du
 * back-office. Aucune valeur par défaut métier ici : un champ non transmis
 * n'est simplement pas modifié — le service de lecture (CrmSettingsService)
 * renverra `configured: false` tant que le commerçant n'a rien renseigné.
 *
 * Les seules bornes codées en dur sont TECHNIQUES (plages de validité des
 * nombres, longueur des chaînes) : elles empêchent l'absurdité (ratio
 * négatif, seuil > 100 %) sans jamais choisir de règle métier à la place du
 * commerçant.
 */
export class UpdateCrmSettingsDto {
  /** Canaux acceptés par le shop pour la collecte de clients. */
  @IsOptional()
  @IsBoolean()
  channelsWhatsapp?: boolean;

  @IsOptional()
  @IsBoolean()
  channelsInstagram?: boolean;

  @IsOptional()
  @IsBoolean()
  channelsMessenger?: boolean;

  /** Fidélité. */
  @IsOptional()
  @IsBoolean()
  loyaltyEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(CRM_SETTINGS_INPUT_BOUNDS.pointsPerCurrencyUnit.min)
  @Max(CRM_SETTINGS_INPUT_BOUNDS.pointsPerCurrencyUnit.max)
  loyaltyPointsPerCurrencyUnit?: number;

  @IsOptional()
  @IsNumber()
  @Min(CRM_SETTINGS_INPUT_BOUNDS.pointsToCurrencyRatio.min)
  @Max(CRM_SETTINGS_INPUT_BOUNDS.pointsToCurrencyRatio.max)
  loyaltyPointsToCurrencyRatio?: number;

  /** Code devise affiché (ex. XAF). Vide = non renseigné. */
  @IsOptional()
  @IsString()
  @MaxLength(8)
  loyaltyCurrency?: string;

  /** Alerte perte/vol. */
  @IsOptional()
  @IsBoolean()
  shrinkageEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(CRM_SETTINGS_INPUT_BOUNDS.maxDeltaPercent.min)
  @Max(CRM_SETTINGS_INPUT_BOUNDS.maxDeltaPercent.max)
  shrinkageMaxDeltaPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(CRM_SETTINGS_INPUT_BOUNDS.windowDays.min)
  @Max(CRM_SETTINGS_INPUT_BOUNDS.windowDays.max)
  shrinkageWindowDays?: number;

  /** Référentiel de pointures de la boutique : '' = non renseigné. */
  @IsOptional()
  @IsIn(['EU', 'UK', 'US', ''])
  boutiqueSizeSystem?: string;

  /** Nombre de ventes par défaut par page d'historique. */
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  historyDefaultLimit?: number;

  /** Chemins metaData fusionnés par CONCATÉNATION (séparés par des virgules). */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDataAppendPaths?: string;
}
