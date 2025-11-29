import { IsInt, Min } from 'class-validator';

export class TransferStockDto {
  @IsInt()
  @Min(1)
  amount: number;
}
