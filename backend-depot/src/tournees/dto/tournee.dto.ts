import {
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
  Min,
  MinLength,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class OuvrirTourneeDto {
  @IsString()
  tricycleId: string;

  @IsString()
  depotId: string;

  @IsString()
  commercialId: string;

  @IsString()
  tenantId: string;
}

export class LigneChargementDto {
  @IsString()
  articleId: string;

  @IsNumber()
  @Min(1)
  quantiteChargee: number;
}

export class ChargerTourneeDto {
  @IsString()
  tourneeId: string;

  @IsString()
  tenantId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LigneChargementDto)
  lignes: LigneChargementDto[];
}

export class ClotureCommercialeDto {
  @IsString()
  tourneeId: string;

  @IsString()
  tenantId: string;

  @IsNumber()
  @Min(0)
  cashRemis: number;

  @IsNumber()
  @Min(0)
  omRemis: number;

  @IsNumber()
  @Min(0)
  momoRemis: number;

  @IsOptional()
  @IsString()
  noteCloture?: string;
}

export class ValidationMagasinierDto {
  @IsString()
  tourneeId: string;

  @IsString()
  tenantId: string;

  @IsArray()
  lignesRetour: { articleId: string; quantiteRetour: number }[];

  @IsOptional()
  @IsString()
  noteValidation?: string;
}

const trimString = ({ value }: { value: unknown }) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();

export class CreateTricycleDto {
  @IsString()
  @Transform(trimString)
  @MinLength(1, { message: 'Le nom / immatriculation du tricycle est requis.' })
  @MaxLength(80, {
    message: 'Le nom du tricycle ne peut pas dépasser 80 caractères.',
  })
  nom: string;

  // Ces deux champs sont TOUJOURS écrasés côté contrôleur par le scope
  // serveur (req.user.tenantId / req.depotScope.depotId). Ils restent
  // optionnels dans le DTO : un client malveillant ne peut ni les omitir
  // (400) ni en injecter un autre (écrasement serveur).
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  depotId?: string;
}

export class UpdateTricycleDto {
  @IsString()
  @Transform(trimString)
  @MinLength(1, { message: 'Le nom / immatriculation du tricycle est requis.' })
  @MaxLength(80, {
    message: 'Le nom du tricycle ne peut pas dépasser 80 caractères.',
  })
  nom: string;
}
