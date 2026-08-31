import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateFournisseurDto {
  @IsString()
  nom: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  soldeInitial?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  // Conservé pour compatibilité avec les anciens clients API.
  // Le controller/service utilisent exclusivement le scope serveur.
  @IsOptional()
  @IsString()
  tenantId?: string;
}
