import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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
  logo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  messageFin?: string;
}
