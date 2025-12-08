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
    const { items, clientId, observations, paymentMethod, deliveryDate } = createOrderDto;

    const productIds = items.map((item) => item.productId);
    const productsInDb = await this.prisma.product.findMany({ where: { id: { in: productIds } } });
    
    if (productsInDb.length !== productIds.length) {
      throw new NotFoundException('Produtos não encontrados.');
    }

    if (clientId) {
      const exists = await this.prisma.client.findUnique({ where: { id: clientId } });
      if (!exists) throw new NotFoundException('Cliente não encontrado.');
    }

    let total = 0;
    const orderItemsData = items.map((item) => {
      const product = productsInDb.find((p) => p.id === item.productId);
      if (!product) throw new BadRequestException(`Produto erro.`);
      
      const priceVal = Number(product.price);
      total += priceVal * item.quantity;
      
      return { productId: item.productId, quantity: item.quantity, price: priceVal };
    });

    if (paymentMethod === PaymentMethodDto.CARTAO) total *= 1.06;

    const methodForDb = paymentMethod as unknown as PaymentMethod;

    const newOrder = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          total,
          status: 'PENDENTE',
          observations,
          clientId,
          paymentMethod: methodForDb,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
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
      where: {deletedAt: null },
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
    const { items, clientId, observations, status, paymentMethod, deliveryDate } = updateOrderDto;

    const currentOrder = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!currentOrder) throw new NotFoundException(`Pedido #${id} não encontrado.`);

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      let total = Number(currentOrder.total);
      
      if (items && items.length > 0) {
        await tx.orderItem.deleteMany({ where: { orderId: id } });

        const productIds = items.map(i => i.productId);
        const productsInDb = await this.prisma.product.findMany({ where: { id: { in: productIds } } });

        let newTotal = 0;
        const newItemsData = items.map(item => {
          const product = productsInDb.find(p => p.id === item.productId);
          if (!product) throw new BadRequestException(`Produto ID ${item.productId} não encontrado.`);
          
          const priceVal = Number(product.price);
          newTotal += priceVal * item.quantity;

          return { productId: item.productId, quantity: item.quantity, price: priceVal, orderId: id };
        });

        const methodToCheck = paymentMethod || currentOrder.paymentMethod;
        // @ts-ignore
        if (methodToCheck === 'CARTAO' || methodToCheck === 'CARTÃO') { 
             newTotal *= 1.06;
        }

        await tx.orderItem.createMany({ data: newItemsData });
        total = newTotal;
      }

      return tx.order.update({
        where: { id },
        data: {
          status,
          clientId,
          observations,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
          paymentMethod: paymentMethod as any,
          total: items ? total : undefined,
        },
        include: { items: true, client: true }
      });
    });

    await this.auditService.createLog(userId, 'UPDATE', 'Order', id, 'Pedido editado.');
    return updatedOrder;
  }

  async remove(id: number, userId: number) {
    await this.prisma.order.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    
    await this.auditService.createLog(userId, 'DELETE', 'Order', id, 'Pedido movido para a lixeira.');
    return { message: 'Sucesso' };
  }

  // --- NOVO MÉTODO CORRIGIDO ---
  async removeAll(userId: number) {
    const count = await this.prisma.$transaction(async (tx) => {
      // 1. Apagar itens primeiro para não violar foreign key
      await tx.orderItem.deleteMany({});
      // 2. Apagar pedidos
      return tx.order.deleteMany({});
    });

    await this.auditService.createLog(userId, 'DELETE_ALL', 'Order', 0, `Limpou ${count.count} pedidos.`);
    return { message: `Foram removidos ${count.count} pedidos.` };
  }
}
