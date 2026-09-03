import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDepotDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  nom: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  adresse: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  emplacement: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(20)
  codePrefix?: string;
}
