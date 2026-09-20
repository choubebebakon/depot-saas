import { IsString, MinLength, MaxLength } from 'class-validator';

/**
 * Code d'autorisation renvoyé par le SDK JS Embedded Signup / Facebook Login
 * for Business dans le callback navigateur (fait vérifié n°1) — transmis par
 * le frontend via un appel API classique, JAMAIS par une redirection serveur.
 */
export class ConnectMetaIntegrationDto {
  @IsString()
  @MinLength(8)
  @MaxLength(2048)
  code!: string;
}
