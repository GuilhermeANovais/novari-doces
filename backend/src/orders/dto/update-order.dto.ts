import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto, PaymentMethodDto } from './create-order.dto';
import { IsOptional, IsArray, ValidateNested, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  // --- ADICIONADO: Campo Status ---
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];

  @IsOptional()
  @IsEnum(PaymentMethodDto)
  paymentMethod?: PaymentMethodDto;
}