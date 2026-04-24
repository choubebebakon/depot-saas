import { IsString, IsArray, IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OuvrirTourneeDto {
    @IsString()
    tricycleId: string;

    @IsString()
    depotId: string;

    @IsString()
    commercialId: string;

    @IsString()
    tenantId: string;
}

export class LigneChargementDto {
    @IsString()
    articleId: string;

    @IsNumber()
    @Min(1)
    quantiteChargee: number;
}

export class ChargerTourneeDto {
    @IsString()
    tourneeId: string;

    @IsString()
    tenantId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => LigneChargementDto)
    lignes: LigneChargementDto[];
}

export class ClotureCommercialeDto {
    @IsString()
    tourneeId: string;

    @IsString()
    tenantId: string;

    @IsNumber()
    @Min(0)
    cashRemis: number;

    @IsNumber()
    @Min(0)
    omRemis: number;

    @IsNumber()
    @Min(0)
    momoRemis: number;

    @IsOptional()
    @IsString()
    noteCloture?: string;
}

export class ValidationMagasinierDto {
    @IsString()
    tourneeId: string;

    @IsString()
    tenantId: string;

    @IsArray()
    lignesRetour: { articleId: string; quantiteRetour: number }[];

    @IsOptional()
    @IsString()
    noteValidation?: string;
}

export class CreateTricycleDto {
    @IsString()
    nom: string;

    @IsString()
    tenantId: string;
}
