import { IsString, IsOptional } from 'class-validator';

export class CreateFournisseurDto {
    @IsString()
    nom: string;

    @IsOptional()
    @IsString()
    telephone?: string;

    @IsString()
    tenantId: string;
}
