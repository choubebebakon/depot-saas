import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(160)
  nomEntreprise: string;

  @IsEmail()
  @MaxLength(180)
  emailPatron: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  @Matches(/^[0-9+().\s-]*$/, { message: 'Téléphone invalide.' })
  telephone?: string;
}
