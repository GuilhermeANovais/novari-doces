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
    // CORREÇÃO: Extrair deliveryDate do DTO
    const { items, clientId, observations, paymentMethod, deliveryDate } = createOrderDto;

    // 1. Validar produtos
    const productIds = items.map((item) => item.productId);
    const productsInDb = await this.prisma.product.findMany({ where: { id: { in: productIds } } });
    
    if (productsInDb.length !== productIds.length) {
      throw new NotFoundException('Alguns produtos não foram encontrados.');
    }

    // 2. Validar Cliente (se enviado)
    if (clientId) {
      const exists = await this.prisma.client.findUnique({ where: { id: clientId } });
      if (!exists) throw new NotFoundException('Cliente não encontrado.');
    }

    // 3. Calcular Total
    let total = 0;
    const orderItemsData = items.map((item) => {
      const product = productsInDb.find((p) => p.id === item.productId);
      if (!product) throw new BadRequestException(`Produto erro.`);
      
      // CORREÇÃO CRÍTICA: Converter Decimal para Number antes de multiplicar
      const priceVal = Number(product.price);
      total += priceVal * item.quantity;
      
      return { 
        productId: item.productId, 
        quantity: item.quantity, 
        price: priceVal // Salva como número
      };
    });

    // Taxa do Cartão (usando o Enum sem acento)
    if (paymentMethod === PaymentMethodDto.CARTAO) {
      total *= 1.06;
    }

    // Cast seguro para o Enum do Prisma
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
          // CORREÇÃO: Salvar a data de entrega (se existir)
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

  // ... (manter findAll, findOne, update, remove como estavam) ...
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
