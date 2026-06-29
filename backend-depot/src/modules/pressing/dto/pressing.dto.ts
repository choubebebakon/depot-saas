import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class VetementPressingDto {
  @IsString() designation: string;
  @IsOptional() @IsString() couleur?: string;
  @IsOptional() @IsString() marque?: string;
  @IsString() typeService: string;
  @IsNumber() prix: number;
}

export class CreateTicketPressingDto {
  @IsString() clientId: string;
  @IsString() reference: string;
  @IsNumber() montantTotal: number;
  @IsNumber() avance: number;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VetementPressingDto)
  vetements: VetementPressingDto[];
}

export class UpdateTicketStatutDto {
  @IsString() statut: string;
}
