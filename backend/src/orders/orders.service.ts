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

  async create(createOrderDto: CreateOrderDto, userId: number, organizationId: number) {
    const { items, clientId, observations, paymentMethod, deliveryDate } = createOrderDto;
    const orgId = Number(organizationId); // Garante número

    const productIds = items.map((item) => item.productId);
    const productsInDb = await this.prisma.product.findMany({ 
      where: { 
        id: { in: productIds },
        organizationId: orgId 
      } 
    });
    
    if (productsInDb.length !== productIds.length) {
      throw new NotFoundException('Alguns produtos não foram encontrados nesta organização.');
    }

    if (clientId) {
      const exists = await this.prisma.client.findUnique({ where: { id: clientId } });
      if (!exists || exists.organizationId !== orgId) throw new NotFoundException('Cliente não encontrado.');
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
          organizationId: orgId,
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
      // Removido organizationId do final (createLog aceita apenas 5 args)
      await this.auditService.createLog(userId, 'CREATE', 'Order', newOrder.id, `Pedido criado. R$ ${total.toFixed(2)}`);
    }

    return newOrder;
  }

  findAll(organizationId: number) {
    return this.prisma.order.findMany({
      where: {
        deletedAt: null,
        organizationId: Number(organizationId)
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        client: { select: { name: true, phone: true } },
        items: { include: { product: true } }
      }
    });
  }

  findOne(id: number, organizationId: number) {
    return this.prisma.order.findUnique({
      where: { id }, // Prisma já filtra único por ID, mas poderíamos validar org depois
      include: {
        user: { select: { name: true, email: true } },
        client: { select: { name: true, phone: true, address: true } },
        items: { include: { product: { select: { name: true, price: true } } } }
      }
    });
  }

  async update(id: number, updateOrderDto: UpdateOrderDto, userId: number, organizationId: number) {
    const { items, clientId, observations, status, paymentMethod, deliveryDate } = updateOrderDto;
    const orgId = Number(organizationId);

    const currentOrder = await this.prisma.order.findFirst({ 
      where: { id, organizationId: orgId },
      include: { items: true } 
    });
    if (!currentOrder) throw new NotFoundException(`Pedido #${id} não encontrado.`);

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      let total = Number(currentOrder.total);
      
      if (items && items.length > 0) {
        await tx.orderItem.deleteMany({ where: { orderId: id } });

        const productIds = items.map(i => i.productId);
        const productsInDb = await this.prisma.product.findMany({ 
          where: { id: { in: productIds }, organizationId: orgId } 
        });

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

  async remove(id: number, userId: number, organizationId: number) {
    const orgId = Number(organizationId);
    // Verifica posse antes de deletar
    const order = await this.prisma.order.findFirst({ where: { id, organizationId: orgId } });
    if (!order) throw new NotFoundException("Pedido não encontrado");

    await this.prisma.order.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    
    await this.auditService.createLog(userId, 'DELETE', 'Order', id, 'Pedido movido para a lixeira.');
    return { message: 'Sucesso' };
  }

  async removeAll(userId: number, organizationId: number) {
    const orgId = Number(organizationId);
    
    const count = await this.prisma.$transaction(async (tx) => {
      // Remove apenas itens de pedidos desta organização
      await tx.orderItem.deleteMany({
        where: { order: { organizationId: orgId } }
      });
      return tx.order.deleteMany({
        where: { organizationId: orgId }
      });
    });

    await this.auditService.createLog(userId, 'DELETE_ALL', 'Order', 0, `Limpou ${count.count} pedidos.`);
    return { message: `Foram removidos ${count.count} pedidos.` };
  }
}
