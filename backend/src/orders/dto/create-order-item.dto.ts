import { IsInt, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({ description: 'ID do Produto', example: 1 })
  @IsInt()
  productId: number;

  @ApiProperty({ description: 'Quantidade do produto', example: 2 })
  @IsInt()
  @IsPositive()
  quantity: number;
}
