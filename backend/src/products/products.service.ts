import { Injectable, BadRequestException } from '@nestjs/common'; // 1. Importar BadRequestException
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
    return this.prisma.product.findMany();
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

  // --- A CORREÇÃO ESTÁ AQUI ---
  async remove(id: number) {
    // 1. Antes de apagar, verifica se o produto existe em algum pedido
    const productInUse = await this.prisma.orderItem.findFirst({
      where: { productId: id },
    });

    // 2. Se estiver em uso, impede a exclusão e avisa o Frontend
    if (productInUse) {
      throw new BadRequestException(
        'Não é possível excluir: Este produto já tem vendas registadas. Sugerimos editar o nome para "INDISPONÍVEL" ou arquivar.'
      );
    }

    // 3. Se não tiver vendas, apaga tranquilamente
    return this.prisma.product.delete({
      where: { id: id },
    });
  }

  async transferToDelivery(id: number, amount: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    
    if (!product) throw new BadRequestException('Produto não encontrado');
    if (product.stockKitchen < amount) {
      throw new BadRequestException(`Estoque da Cozinha insuficiente (${product.stockKitchen})`);
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        stockKitchen: { decrement: amount },
        stockDelivery: { increment: amount },
      },
    });
  }

  // 2. Adicionar na Cozinha (Produção)
  async addKitchenStock(id: number, amount: number) {
    return this.prisma.product.update({
      where: { id },
      data: { stockKitchen: { increment: amount } },
    });
  }

  // 3. Adicionar no Delivery (Compra Externa / Refrigerantes)
  async addDeliveryStock(id: number, amount: number) {
    return this.prisma.product.update({
      where: { id },
      data: { stockDelivery: { increment: amount } },
    });
  }
}

