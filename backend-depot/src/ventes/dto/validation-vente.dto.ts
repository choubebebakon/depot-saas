import { IsNotEmpty, IsString } from 'class-validator';

export class ValiderSortieVenteDto {
    @IsString()
    @IsNotEmpty()
    tenantId: string;
}

export class AnnulerVenteDto {
    @IsString()
    @IsNotEmpty()
    tenantId: string;

    @IsString()
    @IsNotEmpty()
    motif: string;
}
