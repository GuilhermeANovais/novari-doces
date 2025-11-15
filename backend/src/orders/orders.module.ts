import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PdfService } from 'src/pdf/pdf.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PdfService],
})
export class OrdersModule {}
