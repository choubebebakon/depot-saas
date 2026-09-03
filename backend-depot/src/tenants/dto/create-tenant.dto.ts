import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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
  telephone?: string;
}
