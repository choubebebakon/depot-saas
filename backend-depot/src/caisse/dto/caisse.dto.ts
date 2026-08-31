import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class OuvrirCaisseDto {
  @IsNumber()
  @Min(0)
  fondInitial: number;

  // Le depotId est résolu côté serveur depuis le scope authentifié.
  // Le champ reste optionnel uniquement pour compatibilité avec les anciens
  // clients : le controller/service n'en fait jamais une source d'autorité.
  @IsOptional()
  @IsString()
  depotId?: string;

  // Conservé optionnellement pour compatibilité de payload. La valeur finale
  // est toujours remplacée par req.user.id côté serveur.
  @IsOptional()
  @IsString()
  userId?: string;

  // Conservé optionnellement pour compatibilité de payload. La valeur finale
  // est toujours remplacée par req.user.tenantId côté serveur.
  @IsOptional()
  @IsString()
  tenantId?: string;
}

export class FermerCaisseDto {
  @IsString()
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
  motifEcart?: string;
}

export class CreateDepenseDto {
  @IsString()
  categorie: string;

  @IsNumber()
  @Min(0)
  montant: number;

  @IsString()
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
  photoUrl?: string;
}
