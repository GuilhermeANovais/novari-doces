// src/orders/dto/update-order.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateOrderDto } from './create-order.dto';
import { IsString, IsOptional, IsIn } from 'class-validator';

const validStatus = [
  'PENDENTE',
  'EM_PREPARO',
  'PRONTO',
  'CONCLUÍDO',
  'CANCELADO',
  'SINAL_PAGO',
];

// PartialType herda tudo de CreateOrderDto (items, clientId, paymentMethod, etc.) como opcional
export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsString()
  @IsOptional()
  @IsIn(validStatus, { message: 'Status inválido.' })
  status?: string;
}
