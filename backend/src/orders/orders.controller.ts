import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe, Res, Query,
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
    return this.ordersService.create(createOrderDto, req.user.userId);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  // --- Rota PDF Corrigida ---
  @Get(':id/pdf')
  async getOrderPdf(
    @Param('id', ParseIntPipe) id: number,
    @Query('type') type: 'receipt' | 'kitchen' = 'receipt',
    @Res() res: Response,
  ) {
    // Chama o novo método unificado do Service
    const { buffer, filename } = await this.pdfService.generatePdf(id, type);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateOrderDto: UpdateOrderDto, @Request() req: any) {
    return this.ordersService.update(id, updateOrderDto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.ordersService.remove(id, req.user.userId);
  }
}
