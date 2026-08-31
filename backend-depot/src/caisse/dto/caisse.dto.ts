import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class OuvrirCaisseDto {
  @IsNumber()
  @Min(0)
  fondInitial: number;

  // Le depotId est résolu côté serveur depuis le scope authentifié.
  @IsOptional()
  @IsString()
  depotId?: string;

  // Conservé optionnellement pour compatibilité avec les anciens clients.
  // La valeur finale est toujours remplacée par req.user.id côté serveur.
  @IsOptional()
  @IsString()
  userId?: string;

  // Conservé optionnellement pour compatibilité avec les anciens clients.
  // La valeur finale est toujours remplacée par req.user.tenantId côté serveur.
  @IsOptional()
  @IsString()
  tenantId?: string;
}

export class FermerCaisseDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  // Compatibilité legacy : le tenant est toujours injecté côté serveur.
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsNumber()
  @Min(0)
  fondFinal: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  motifEcart?: string;
}

export class CreateDepenseDto {
  // Identifiant généré côté client uniquement pour permettre l'idempotence
  // des synchronisations offline. Il ne constitue jamais une autorité métier.
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  categorie: string;

  @IsNumber()
  @Min(0.01)
  montant: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  motif: string;

  // Compatibilité legacy : le dépôt est résolu depuis le scope serveur.
  @IsOptional()
  @IsString()
  depotId?: string;

  // Compatibilité legacy : le tenant est toujours injecté côté serveur.
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  photoUrl?: string;
}
