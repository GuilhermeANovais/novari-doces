// src/orders/dto/update-order.dto.ts
import { IsString, IsNotEmpty, IsIn } from 'class-validator';

// Lista de status válidos
const validStatus = [
  'PENDENTE',
  'CONCLUÍDO',
  'CANCELADO',
  'SINAL PAGO',
  'EM ANDAMENTO',
];

export class UpdateOrderDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(validStatus, { message: 'Status inválido.' })
  status: string;
}
