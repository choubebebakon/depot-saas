import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class OuvrirCaisseDto {
    @IsNumber()
    @Min(0)
    fondInitial: number;

    @IsString()
    depotId: string;

    @IsString()
    userId: string;

    @IsString()
    tenantId: string;
}

export class FermerCaisseDto {
    @IsString()
    sessionId: string;

    @IsNumber()
    @Min(0)
    fondFinal: number;

    @IsOptional()
    @IsString()
    motifEcart?: string;
}

export class CreateDepenseDto {
    @IsString()
    categorie: string;

    @IsNumber()
    @Min(0)
    montant: number;

    @IsString()
    motif: string;

    @IsString()
    depotId: string;

    @IsString()
    tenantId: string;

    @IsOptional()
    @IsString()
    photoUrl?: string;
}
