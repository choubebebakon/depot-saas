import { Type } from 'class-transformer';
import { IsOptional, IsString, IsBoolean, IsEnum, IsUUID, IsObject, IsArray, IsInt, Min, Max } from 'class-validator';
import { NotifType, NotifCategory, NotifPriority, NotifChannel } from '@prisma/client';

export class CreateNotificationDto {
  @IsEnum(NotifType)
  type: NotifType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEnum(NotifCategory)
  category?: NotifCategory;

  @IsOptional()
  @IsEnum(NotifPriority)
  priority?: NotifPriority;

  @IsOptional()
  @IsEnum(NotifChannel)
  channel?: NotifChannel;

  @IsOptional()
  @IsString()
  actionUrl?: string;

  @IsOptional()
  @IsString()
  actionLabel?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  groupKey?: string;
}

export class NotificationFilter {
  @IsOptional()
  @IsEnum(NotifType)
  type?: NotifType;

  @IsOptional()
  @IsEnum(NotifCategory)
  category?: NotifCategory;

  @IsOptional()
  @IsEnum(NotifPriority)
  priority?: NotifPriority;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  critical: number;
  high: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
}

export interface NotificationPayload {
  id: string;
  type: NotifType;
  title?: string;
  message?: string;
  category: NotifCategory;
  priority: NotifPriority;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export type MetierNotificationData =
  | { type: 'STOCK_CRITIQUE'; articleNom: string; quantite: number; seuil: number; articleId: string }
  | { type: 'STOCK_RUPTURE'; articleNom: string; articleId: string }
  | { type: 'STOCK_EXPIRATION'; articleNom: string; dateExpiration: string; lotId: string; joursRestants: number }
  | { type: 'RESERVATION_NOUVELLE'; numeroChambre: string; nomClient: string; dateArrivee: string }
  | { type: 'RESERVATION_ANNULEE'; numeroChambre: string; nomClient: string }
  | { type: 'COMMANDE_NOUVELLE'; numeroCommande: string; montant: number }
  | { type: 'COMMANDE_PRETE'; numeroCommande: string }
  | { type: 'COMMANDE_RETARD'; numeroCommande: string; retardMinutes: number }
  | { type: 'REPARATION_PRETE'; vehicule: string; client: string }
  | { type: 'CHECKIN_HOTEL'; chambre: string; client: string }
  | { type: 'CHECKOUT_HOTEL'; chambre: string; client: string }
  | { type: 'CHAMBRE_MENAGE'; chambre: string }
  | { type: 'RDV_RAPPEL'; patient: string; heure: string }
  | { type: 'VACCINATION_PREVUE'; lotId: string; vaccinationType: string; datePrevue: string }
  | { type: 'LIVRAISON_TERMINEE'; client: string; montant: number }
  | { type: 'PAYMENT_SUCCESS'; montant: number; methode: string }
  | { type: 'PAYMENT_FAILED'; montant: number; raison?: string }
  | { type: 'EXPIRY_J7'; plan: string; dateExpiration: string }
  | { type: 'EXPIRY_J3'; plan: string; dateExpiration: string }
  | { type: 'EXPIRY_J1'; plan: string; dateExpiration: string }
  | { type: 'ALERTE_PREDICTIVE'; message: string; score: number }
  | { type: 'RAPPORT_JOURNALIER'; ventesJour: number; nouveauClients: number; alertes: number };

export class UpdatePreferencesDto {
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  whatsappEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @IsOptional()
  @IsString()
  silenceStart?: string;

  @IsOptional()
  @IsString()
  silenceEnd?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  disabledCategories?: string[];

  @IsOptional()
  @IsBoolean()
  dailyDigest?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  digestHour?: number;
}
