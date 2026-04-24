import { IsString, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';

export class CreateFamilleDto {
    @IsString()
    nom: string;

    @IsOptional()
    @IsString()
    emoji?: string;

    @IsString()
    tenantId: string;
}

export class CreateMarqueDto {
    @IsString()
    nom: string;

    @IsString()
    familleId: string;

    @IsString()
    tenantId: string;
}

export class CreateArticleDto {
    @IsString()
    designation: string;

    @IsOptional()
    @IsString()
    format?: string;

    @IsNumber()
    @Min(0)
    prixVente: number;

    @IsNumber()
    @Min(0)
    prixAchat: number;

    @IsOptional()
    @IsNumber()
    seuilCritique?: number;

    @IsOptional()
    @IsBoolean()
    estConsigne?: boolean;

    @IsOptional()
    @IsNumber()
    uniteParCasier?: number;

    @IsOptional()
    @IsNumber()
    uniteParPack?: number;

    @IsOptional()
    @IsNumber()
    uniteParPalette?: number;

    @IsOptional()
    @IsString()
    familleId?: string;

    @IsOptional()
    @IsString()
    marqueId?: string;

    @IsString()
    tenantId: string;
}

export class UpdateArticleDto {
    @IsOptional()
    @IsString()
    designation?: string;

    @IsOptional()
    @IsString()
    format?: string;

    @IsOptional()
    @IsNumber()
    prixVente?: number;

    @IsOptional()
    @IsNumber()
    prixAchat?: number;

    @IsOptional()
    @IsNumber()
    seuilCritique?: number;

    @IsOptional()
    @IsBoolean()
    estConsigne?: boolean;

    @IsOptional()
    @IsNumber()
    uniteParCasier?: number;

    @IsOptional()
    @IsNumber()
    uniteParPack?: number;

    @IsOptional()
    @IsNumber()
    uniteParPalette?: number;

    @IsOptional()
    @IsString()
    familleId?: string;

    @IsOptional()
    @IsString()
    marqueId?: string;
}
