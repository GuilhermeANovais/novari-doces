// backend/src/orders/orders.controller.ts
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
  Res,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PdfService } from 'src/pdf/pdf.service';
import type { Response } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly pdfService: PdfService,
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

  // --- NOVA ROTA DE DELIVERY ---
  // (Importante: Deve vir ANTES de :id para não dar conflito)
  @Get('delivery/daily')
  getDeliveryStats() {
    return this.ordersService.getDeliveryStats();
  }

  // --- Endpoint de PDF ---
  @Get(':id/pdf')
  async getOrderPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const { html, order } = await this.pdfService.generateOrderHtml(id);
    const pdfBuffer = await this.pdfService.generatePdfFromHtml(html);

    const date = new Date(order.createdAt);
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    const clientName = (order.client?.name || 'Pedido_Interno').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `pedido_${order.id}_${clientName}_${dateString}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );

    res.send(pdfBuffer);
  }

  // As rotas com :id vêm sempre em baixo
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    return this.ordersService.update(id, updateOrderDto, userId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const userId = req.user.userId;
    return this.ordersService.remove(id, userId);
  }
}