import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, Min } from 'class-validator';

export enum TypeConsigneEnum {
    BOUTEILLE_33CL = 'BOUTEILLE_33CL',
    BOUTEILLE_60CL = 'BOUTEILLE_60CL',
    CASIER = 'CASIER',
    PALETTE = 'PALETTE',
    PACK_EAU = 'PACK_EAU',
}

export class CreateTypeConsigneDto {
    @IsEnum(TypeConsigneEnum)
    type: TypeConsigneEnum;

    @IsNumber()
    @Min(0)
    valeurXAF: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    tenantId: string;
}

export class UpdateTypeConsigneDto {
    @IsNumber()
    @Min(0)
    valeurXAF: number;

    @IsOptional()
    @IsString()
    description?: string;
}

export class MouvementConsigneDto {
    @IsString()
    typeConsigneId: string;

    @IsNumber()
    @Min(1)
    quantite: number;

    @IsBoolean()
    estSortie: boolean; // true = vides sortis, false = vides rendus

    @IsOptional()
    @IsString()
    clientId?: string;

    @IsOptional()
    @IsString()
    venteId?: string;

    @IsOptional()
    @IsString()
    motif?: string;

    @IsString()
    tenantId: string;
}

export class RenduSansAchatDto {
    @IsString()
    clientId: string;

    @IsString()
    typeConsigneId: string;

    @IsNumber()
    @Min(1)
    quantite: number;

    @IsBoolean()
    estRemboursementCash: boolean; // true = cash, false = avoir

    @IsString()
    tenantId: string;
}

export class VenteAvecConsignesDto {
    @IsString()
    venteId: string;

    lignesConsignes: {
        typeConsigneId: string;
        quantiteSortie: number;  // emballages sortis avec la vente
        quantiteRendue: number;  // vides rendus par le client
    }[];

    @IsString()
    tenantId: string;

    @IsOptional()
    @IsString()
    clientId?: string;
}