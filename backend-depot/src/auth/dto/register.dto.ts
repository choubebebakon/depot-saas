import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'Douala Boissons SARL',
    minLength: 2,
    maxLength: 100,
    description: "Nom legal ou commercial de l'entreprise cliente.",
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nomEntreprise: string;

  @ApiProperty({
    example: 'admin@doualaboissons.cm',
    description: "Email de l'administrateur du tenant.",
  })
  @IsEmail({}, { message: 'Email invalide.' })
  email: string;

  @ApiProperty({
    example: 'MotDePasseSolide123',
    minLength: 8,
    description: "Mot de passe de l'administrateur.",
  })
  @IsString()
  @MinLength(8, { message: 'Mot de passe trop court (8 caracteres minimum).' })
  password: string;

  @ApiProperty({
    example: true,
    description: "Acceptation obligatoire des CGU en vigueur.",
  })
  @IsBoolean()
  acceptTerms: boolean;

  @ApiProperty({
    example: 'DEPOT_BOISSONS',
    required: false,
    description: "Metier choisi pendant l'inscription.",
  })
  @IsOptional()
  @IsString()
  metier?: string;
}
