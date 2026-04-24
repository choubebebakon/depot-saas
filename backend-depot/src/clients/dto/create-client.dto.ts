import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateClientDto {
    @IsString()
    nom: string;

    @IsOptional()
    @IsString()
    telephone?: string;

    @IsOptional()
    @IsString()
    adresse?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    plafondCredit?: number;

    @IsString()
    tenantId: string;
}
