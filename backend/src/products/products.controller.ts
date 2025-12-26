import {
  Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Request
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto, @Request() req: any) {
    return this.productsService.create(createProductDto, req.user.organizationId);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.productsService.findAll(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.productsService.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req: any
  ) {
    return this.productsService.update(id, updateProductDto, req.user.organizationId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.productsService.remove(id, req.user.organizationId);
  }
}
