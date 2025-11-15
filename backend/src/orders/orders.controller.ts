// src/orders/orders.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
  Res, // 1. Importe o 'Res' (Resposta do Express)
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PdfService } from 'src/pdf/pdf.service'; // 2. Importe o PdfService
import type { Response } from 'express'; // 3. Importe os tipos do Express

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly pdfService: PdfService, // 4. Injete o PdfService
  ) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @Request() req: any) {
    const userId = req.user.userId;
    return this.ordersService.create(createOrderDto, userId);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  // --- NOVO ENDPOINT DE PDF ---
  @Get(':id/pdf')
  async getOrderPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response, // 5. Injete a resposta 'res'
  ) {
    // Gere o HTML para o pedido
    const html = await this.pdfService.generateOrderHtml(id);
    // Converta o HTML para um buffer de PDF
    const pdfBuffer = await this.pdfService.generatePdfFromHtml(html);

    // 6. Configure os cabeçalhos da resposta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=pedido_${id}.pdf`, // Sugere um nome para download
    );

    // 7. Envie o PDF como resposta
    res.send(pdfBuffer);
  }
  // --- FIM DO NOVO ENDPOINT ---

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.remove(id);
  }
}
