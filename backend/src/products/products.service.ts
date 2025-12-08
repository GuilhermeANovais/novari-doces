import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  create(createProductDto: CreateProductDto) {
    return this.prisma.product.create({
      data: createProductDto,
    });
  }

  findAll() {
    return this.prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.product.findUnique({
      where: { id: id },
    });
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id: id },
      data: updateProductDto,
    });
  }

  remove(id: number) {
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
