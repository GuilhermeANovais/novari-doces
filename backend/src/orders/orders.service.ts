import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto, PaymentMethodDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AuditService } from 'src/audit/audit.service';
import { PaymentMethod } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: number) {
    const { items, clientId, observations, paymentMethod } = createOrderDto;

    // 1. Validar produtos
    const productIds = items.map((item) => item.productId);
    const productsInDb = await this.prisma.product.findMany({ where: { id: { in: productIds } } });
    if (productsInDb.length !== productIds.length) {
      throw new NotFoundException('Produtos não encontrados.');
    }

    // 2. Validar Cliente
    if (clientId) {
      const exists = await this.prisma.client.findUnique({ where: { id: clientId } });
      if (!exists) throw new NotFoundException('Cliente não encontrado.');
    }

    // 3. Calcular Total
    let total = 0;
    const orderItemsData = items.map((item) => {
      const product = productsInDb.find((p) => p.id === item.productId);
      if (!product) throw new BadRequestException(`Produto erro.`);
      total += product.price * item.quantity;
      return { productId: item.productId, quantity: item.quantity, price: product.price };
    });

    if (paymentMethod === PaymentMethodDto.CARTAO) total *= 1.06;

    const methodForDb = paymentMethod as unknown as PaymentMethod;

    // 4. Criar Pedido
    const newOrder = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          total,
          status: 'PENDENTE',
          observations,
          clientId,
          paymentMethod: methodForDb,
        },
      });

      await tx.orderItem.createMany({
        data: orderItemsData.map((item) => ({ ...item, orderId: order.id })),
      });

      return tx.order.findUnique({ where: { id: order.id }, include: { items: true, client: true } });
    });

    if (newOrder) {
      await this.auditService.createLog(userId, 'CREATE', 'Order', newOrder.id, `Pedido criado. R$ ${total.toFixed(2)}`);
    }

    return newOrder;
  }

  findAll() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        client: { select: { name: true, phone: true } },
        items: { include: { product: true } }
      }
    });
  }

  findOne(id: number) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        client: { select: { name: true, phone: true, address: true } },
        items: { include: { product: { select: { name: true, price: true } } } }
      }
    });
  }

  async update(id: number, updateOrderDto: UpdateOrderDto, userId: number) {
    const currentOrder = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!currentOrder) throw new NotFoundException(`Pedido #${id} não encontrado.`);

    // Lógica simplificada de atualização (sem recalculo complexo de estoque por enquanto, já que removeu delivery)
    // Se quiseres reativar a edição de itens, podes usar a lógica anterior, mas simplificada.
    
    // Atualização básica
    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: updateOrderDto.status,
        clientId: updateOrderDto.clientId,
        observations: updateOrderDto.observations,
      },
    });

    await this.auditService.createLog(userId, 'UPDATE', 'Order', id, 'Pedido atualizado.');
    return updated;
  }

  async remove(id: number, userId: number) {
    await this.prisma.orderItem.deleteMany({ where: { orderId: id } });
    await this.prisma.order.delete({ where: { id } });
    await this.auditService.createLog(userId, 'DELETE', 'Order', id, 'Pedido deletado.');
    return { message: 'Sucesso' };
  }
}
