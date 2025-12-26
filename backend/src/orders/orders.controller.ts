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
    return this.ordersService.create(createOrderDto, req.user.userId, req.user.organizationId);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.ordersService.findAll(req.user.organizationId);
  }

  @Get(':id/pdf')
  async getOrderPdf(
    @Param('id', ParseIntPipe) id: number,
    @Query('type') type: 'receipt' | 'kitchen' = 'receipt',
    @Res() res: Response,
    @Request() req: any // Necessário para validar organização se implementado no service
  ) {
    // Idealmente passaria organizationId para o pdfService também para validar segurança
    const { buffer, filename } = await this.pdfService.generatePdf(id, type);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.ordersService.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateOrderDto: UpdateOrderDto, @Request() req: any) {
    return this.ordersService.update(id, updateOrderDto, req.user.userId, req.user.organizationId);
  }

  @Delete('delete-all')
  removeAll(@Request() req: any) {
    return this.ordersService.removeAll(req.user.userId, req.user.organizationId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.ordersService.remove(id, req.user.userId, req.user.organizationId);
  }
}
