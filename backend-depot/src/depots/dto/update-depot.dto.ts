import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateDepotDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  nom?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  adresse?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(120)
  emplacement?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(20)
  codePrefix?: string;

  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;
}
