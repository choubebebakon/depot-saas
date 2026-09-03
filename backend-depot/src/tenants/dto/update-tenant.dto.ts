import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  nomEntreprise?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(180)
  emailPatron?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(/^[0-9+().\s-]*$/, { message: 'Téléphone invalide.' })
  telephone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  slogan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  adresse?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500_000)
  @Matches(/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=\r\n]+$/, {
    message: 'Le logo doit être une image PNG, JPEG ou WebP encodée en base64.',
  })
  logo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  messageFin?: string;
}
