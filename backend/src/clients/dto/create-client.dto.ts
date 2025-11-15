// src/clients/dto/create-client.dto.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
// A linha de importação errada ('create-order-item.dto') foi removida.

export class CreateClientDto { // A palavra 'export' foi adicionada
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;
}