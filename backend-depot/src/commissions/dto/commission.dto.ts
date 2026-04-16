import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateParametreDto {
    @IsNumber()
    @Min(0)
    @Max(100)
    taux: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    tenantId: string;
}

export class CalculerCommissionsDto {
    @IsString()
    tenantId: string;

    @IsOptional()
    @IsString()
    periode?: string; // Format "2026-04", défaut = mois en cours

    @IsOptional()
    @IsString()
    userId?: string; // Si on veut calculer pour un seul user
}

export class PayerCommissionDto {
    @IsString()
    commissionId: string;

    @IsString()
    tenantId: string;
}