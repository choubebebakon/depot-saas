import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, Min } from 'class-validator';

export enum TypeMaintenanceEnum {
    VIDANGE = 'VIDANGE',
    PNEU = 'PNEU',
    FREINS = 'FREINS',
    CARBURANT = 'CARBURANT',
    REPARATION = 'REPARATION',
    REVISION = 'REVISION',
    AUTRE = 'AUTRE',
}

export class CreateMaintenanceDto {
    @IsString()
    tricycleId: string;

    @IsEnum(TypeMaintenanceEnum)
    type: TypeMaintenanceEnum;

    @IsString()
    description: string;

    @IsNumber()
    @Min(0)
    cout: number;

    @IsOptional()
    @IsNumber()
    kilometrage?: number;

    @IsOptional()
    @IsString()
    datePlanifie?: string;

    @IsOptional()
    @IsString()
    dateEffectue?: string;

    @IsOptional()
    @IsString()
    photoUrl?: string;

    @IsString()
    tenantId: string;
}

export class CreateCarburantDto {
    @IsString()
    tricycleId: string;

    @IsNumber()
    @Min(0)
    litres: number;

    @IsNumber()
    @Min(0)
    prixLitre: number;

    @IsOptional()
    @IsNumber()
    kilometrage?: number;

    @IsOptional()
    @IsNumber()
    nbTours?: number;

    @IsString()
    tenantId: string;
}
