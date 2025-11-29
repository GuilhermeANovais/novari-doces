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
    const { items, clientId, observations, deliveryDate, paymentMethod } = createOrderDto;

    // 1. Validação dos Produtos
    const productIds = items.map((item) => item.productId);
    const productsInDb = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (productsInDb.length !== productIds.length) {
      throw new NotFoundException('Um ou mais produtos não foram encontrados.');
    }

    // --- CORREÇÃO 1: Verifica apenas o estoque do DELIVERY ---
    for (const item of items) {
      const product = productsInDb.find((p) => p.id === item.productId);
      
      // Agora usamos product.stockDelivery em vez de product.stock
      if (product && product.stockDelivery < item.quantity) {
        throw new BadRequestException(
          `Sem estoque no Delivery para: ${product.name}. Disponível: ${product.stockDelivery}. Solicite transferência da Cozinha.`
        );
      }
    }

    // 2. Validação do Cliente
    if (clientId) {
      const clientExists = await this.prisma.client.findUnique({ where: { id: clientId } });
      if (!clientExists) throw new NotFoundException(`Cliente com ID ${clientId} não encontrado.`);
    }

    // 3. Cálculo do Total
    let total = 0;
    const orderItemsData = items.map((item) => {
      const product = productsInDb.find((p) => p.id === item.productId);
      if (!product) throw new BadRequestException(`Produto com ID ${item.productId} erro.`);
      
      const itemTotal = product.price * item.quantity;
      total += itemTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      };
    });

    // 4. Taxa de 6% (Cartão)
    if (paymentMethod === PaymentMethodDto.CARTAO) {
      total *= 1.06;
    }

    const methodForDb = paymentMethod as unknown as PaymentMethod;

    // 5. Transação Principal
    const newOrder = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId, total, status: 'PENDENTE', observations,
          clientId, deliveryDate, paymentMethod: methodForDb,
        },
      });

      await tx.orderItem.createMany({
        data: orderItemsData.map((item) => ({ ...item, orderId: order.id })),
      });

      // --- CORREÇÃO 2: Desconta do DELIVERY ---
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          // Agora decrementamos stockDelivery
          data: { stockDelivery: { decrement: item.quantity } },
        });
      }

      return tx.order.findUnique({
        where: { id: order.id },
        include: { items: true, client: true },
      });
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
        items: { include: { product: { select: { name: true } } } }
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
    const oldOrder = await this.prisma.order.findUnique({ where: { id } });
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: updateOrderDto.status,
        clientId: updateOrderDto.clientId,
        deliveryDate: updateOrderDto.deliveryDate,
        observations: updateOrderDto.observations,
      },
    });
    
    let logMessage = 'Pedido atualizado.';
    if (oldOrder && oldOrder.status !== updatedOrder.status) {
      logMessage = `Status alterado de ${oldOrder.status} para ${updatedOrder.status}.`;
    }
    
    await this.auditService.createLog(userId, 'UPDATE', 'Order', id, logMessage);
    return updatedOrder;
  }

  async remove(id: number, userId: number) {
    const orderToDelete = await this.prisma.order.findUnique({ where: { id } });
    await this.prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId: id } });
      await tx.order.delete({ where: { id } });
    });
    await this.auditService.createLog(userId, 'DELETE', 'Order', id, `Pedido de R$ ${orderToDelete?.total} deletado.`);
    return { message: 'Pedido deletado com sucesso' };
  }

  // --- CORREÇÃO 3: Estatísticas do Delivery ---
  async getDeliveryStats() {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);

    const ordersToday = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
        status: { not: 'CANCELADO' }
      },
      select: {
        id: true, total: true, paymentMethod: true, createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Selecionamos os dois estoques (Kitchen e Delivery) em vez de "stock"
    const inventory = await this.prisma.product.findMany({
      select: { id: true, name: true, stockKitchen: true, stockDelivery: true },
      orderBy: { name: 'asc' }
    });

    return { orders: ordersToday, inventory };
  }
}