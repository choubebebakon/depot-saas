import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'uuid-token-from-email',
    description: 'Token de réinitialisation reçu par email.',
  })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'NouveauMotDePasse123',
    minLength: 8,
    description: 'Nouveau mot de passe (min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre).',
  })
  @IsString()
  @MinLength(8, { message: 'Mot de passe trop court (8 caractères minimum).' })
  newPassword: string;

  @ApiProperty({
    example: 'NouveauMotDePasse123',
    description: 'Confirmation du nouveau mot de passe.',
  })
  @IsString()
  confirmPassword: string;
}