import { IsBoolean, IsHexColor, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateCategorieDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nom!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsOptional()
  @IsHexColor()
  couleur?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  icone?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordre?: number;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
