import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Adresse email du compte pour lequel réinitialiser le mot de passe.',
  })
  @IsEmail({}, { message: 'Email invalide.' })
  email: string;
}