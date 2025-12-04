import { Type } from 'class-transformer';
import {
  ValidateNested,
  IsArray,
  ArrayMinSize,
  IsInt,
  IsOptional,
  IsString,
  IsDateString,
  IsEnum
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; // <--- Importar
import { CreateOrderItemDto } from './create-order-item.dto';

export enum PaymentMethodDto {
  PIX = 'PIX',
  DINHEIRO = 'DINHEIRO',
  CARTAO = 'CARTAO', // Note o acento aqui conforme corrigimos antes
}

export class CreateOrderDto {
  @ApiProperty({ type: [CreateOrderItemDto], description: 'Lista de itens do pedido' })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiPropertyOptional({ description: 'ID do cliente (se cadastrado)' })
  @IsInt()
  @IsOptional()
  clientId?: number;

  @ApiPropertyOptional({ description: 'Observações sobre o pedido' })
  @IsString()
  @IsOptional()
  observations?: string;

  @ApiPropertyOptional({ description: 'Data de entrega (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  deliveryDate?: string;

  @ApiProperty({ enum: PaymentMethodDto, description: 'Método de pagamento' })
  @IsEnum(PaymentMethodDto)
  @IsOptional()
  paymentMethod?: PaymentMethodDto;
}