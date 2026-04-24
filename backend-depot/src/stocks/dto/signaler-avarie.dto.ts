import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SignalerAvarieDto {
    @IsNotEmpty()
    @IsString()
    articleId: string;

    @IsNotEmpty()
    @IsString()
    depotId: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    quantite: number;

    @IsNotEmpty()
    @IsString()
    motif: string; // Ex: Cassé, Percé, Périmé

    @IsOptional()
    @IsString()
    photoUrl?: string;

    @IsNotEmpty()
    @IsString()
    tenantId: string;
}
