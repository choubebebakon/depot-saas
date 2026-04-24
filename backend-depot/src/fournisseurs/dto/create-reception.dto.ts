import { IsString, IsArray, IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class LigneReceptionDto {
    @IsString()
    articleId: string;

    @IsNumber()
    @Min(0)
    quantiteLivree: number;

    @IsNumber()
    @Min(0)
    quantiteGratuite: number;

    @IsNumber()
    @Min(0)
    prixAchatUnitaire: number;

    @IsOptional()
    @IsString()
    unite?: string; // CASIER, PACK, PLATEAU, BOUTEILLE
}

export class CreateReceptionDto {
    @IsString()
    fournisseurId: string;

    @IsString()
    depotId: string;

    @IsString()
    tenantId: string;

    @IsString()
    modePaiement: string;

    @IsNumber()
    @Min(0)
    montantPaye: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => LigneReceptionDto)
    lignes: LigneReceptionDto[];

    @IsOptional()
    @IsString()
    numBordereau?: string;

    @IsOptional()
    @IsString()
    note?: string;
}
