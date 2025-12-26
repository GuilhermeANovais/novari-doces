import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  create(createProductDto: CreateProductDto, organizationId: number) {
    return this.prisma.product.create({
      data: {
        ...createProductDto,
        organizationId: Number(organizationId),
      },
    });
  }

  findAll(organizationId: number) {
    return this.prisma.product.findMany({
      where: { 
        organizationId: Number(organizationId),
        deletedAt: null 
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number, organizationId: number) {
    const product = await this.prisma.product.findFirst({
      where: { id, organizationId: Number(organizationId) },
    });
    if (!product) throw new NotFoundException('Produto não encontrado.');
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto, organizationId: number) {
    await this.findOne(id, organizationId); // Valida

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(id: number, organizationId: number) {
    await this.findOne(id, organizationId); // Valida

    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
