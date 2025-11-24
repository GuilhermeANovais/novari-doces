import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AuditService } from 'src/audit/audit.service';
// Importamos o Enum do Prisma para garantir a tipagem correta
import { PaymentMethod } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  /**
   * Cria um novo Pedido
   */
  async create(createOrderDto: CreateOrderDto, userId: number) {
    // Desestrutura todos os campos, incluindo o novo paymentMethod
    const { items, clientId, observations, deliveryDate, paymentMethod } = createOrderDto;

    // 1. Validação dos Produtos
    const productIds = items.map((item) => item.productId);
    const productsInDb = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (productsInDb.length !== productIds.length) {
      throw new NotFoundException('Um ou mais produtos não foram encontrados.');
    }

    // 2. Validação do Cliente
    if (clientId) {
      const clientExists = await this.prisma.client.findUnique({
        where: { id: clientId },
      });
      if (!clientExists) {
        throw new NotFoundException(`Cliente com ID ${clientId} não encontrado.`);
      }
    }

    // 3. Cálculo do Total
    let total = 0;
    const orderItemsData = items.map((item) => {
      const product = productsInDb.find((p) => p.id === item.productId);
      if (!product) {
        throw new BadRequestException(`Produto com ID ${item.productId} não encontrado.`);
      }
      const itemTotal = product.price * item.quantity;
      total += itemTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      };
    });

    // 4. Transação de Criação
    const newOrder = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: userId,
          total: total,
          status: 'PENDENTE',
          observations: observations,
          clientId: clientId,
          deliveryDate: deliveryDate,
          // Salva o método de pagamento (cast para o tipo do Prisma)
          paymentMethod: paymentMethod as PaymentMethod,
        },
      });

      await tx.orderItem.createMany({
        data: orderItemsData.map((item) => ({
          ...item,
          orderId: order.id,
        })),
      });

      return tx.order.findUnique({
        where: { id: order.id },
        include: { items: true, client: true },
      });
    });

    // Log de Auditoria da criação
    if (newOrder) {
      await this.auditService.createLog(
        userId,
        'CREATE',
        'Order',
        newOrder.id,
        `Pedido criado. Total: R$ ${total}. Pagamento: ${paymentMethod || 'CASH'}`
      );
    }

    return newOrder;
  }

  findAll() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        client: { select: { name: true, phone: true } },
        items: {
          include: { product: { select: { name: true } } }
        }
      }
    });
  }

  findOne(id: number) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        client: { select: { name: true, phone: true, address: true } },
        items: {
          include: { product: { select: { name: true, price: true } } }
        }
      }
    });
  }

  /**
   * Atualiza um pedido e gera Log de Auditoria
   */
  async update(id: number, updateOrderDto: UpdateOrderDto, userId: number) {
    // 1. Busca dados antigos para comparar no log
    const oldOrder = await this.prisma.order.findUnique({ where: { id } });

    // 2. Atualiza
    const updatedOrder = await this.prisma.order.update({
      where: { id: id },
      data: {
        status: updateOrderDto.status,
        clientId: updateOrderDto.clientId,
        deliveryDate: updateOrderDto.deliveryDate,
        observations: updateOrderDto.observations,
        // Se quiser permitir alterar o pagamento depois, adicione paymentMethod aqui também
      },
    });

    // 3. Gera mensagem do Log
    let logMessage = 'Pedido atualizado.';
    if (oldOrder && oldOrder.status !== updatedOrder.status) {
      logMessage = `Status alterado de ${oldOrder.status} para ${updatedOrder.status}.`;
    } else if (updateOrderDto.observations) {
      logMessage = 'Observações atualizadas.';
    }

    // 4. Salva o Log
    await this.auditService.createLog(userId, 'UPDATE', 'Order', id, logMessage);

    return updatedOrder;
  }

  /**
   * Deleta um pedido e gera Log de Auditoria
   */
  async remove(id: number, userId: number) {
    // Busca dados antes de apagar para o log
    const orderToDelete = await this.prisma.order.findUnique({ where: { id } });

    await this.prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId: id } });
      await tx.order.delete({ where: { id: id } });
    });

    // Salva o Log após sucesso
    await this.auditService.createLog(
      userId,
      'DELETE',
      'Order',
      id,
      `Pedido de R$ ${orderToDelete?.total} deletado.`,
    );

    return { message: 'Pedido deletado com sucesso' };
  }
}
