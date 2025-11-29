import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
// CORREÇÃO AQUI: Importar do caminho relativo correto ./dto/...
import { TransferStockDto } from './dto/transfer-stock.dto'; 
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }

  // --- ROTAS DE ESTOQUE ---

  // 1. Transferir: Cozinha -> Delivery
  @Post(':id/transfer')
  transfer(@Param('id', ParseIntPipe) id: number, @Body() dto: TransferStockDto) {
    return this.productsService.transferToDelivery(id, dto.amount);
  }

  // 2. Produzir: Entrada na Cozinha
  @Post(':id/produce')
  produce(@Param('id', ParseIntPipe) id: number, @Body() dto: TransferStockDto) {
    return this.productsService.addKitchenStock(id, dto.amount);
  }

  // 3. Compra Externa: Entrada Direta no Delivery
  @Post(':id/delivery-add')
  addDeliveryStock(@Param('id', ParseIntPipe) id: number, @Body() dto: TransferStockDto) {
    return this.productsService.addDeliveryStock(id, dto.amount);
  }
}
