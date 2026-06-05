import { IsString, IsNotEmpty, IsUUID, IsNumber, IsOptional } from 'class-validator';

export class CreateQuoteDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
