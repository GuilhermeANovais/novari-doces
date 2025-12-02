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

    // Verifica estoque do DELIVERY
    for (const item of items) {
      const product = productsInDb.find((p) => p.id === item.productId);
      if (product && product.stockDelivery < item.quantity) {
        throw new BadRequestException(
          `Sem estoque no Delivery para: ${product.name}. Disponível: ${product.stockDelivery}. Solicite transferência da Cozinha.`
        );
      }
    }

    if (clientId) {
      const clientExists = await this.prisma.client.findUnique({ where: { id: clientId } });
      if (!clientExists) throw new NotFoundException(`Cliente com ID ${clientId} não encontrado.`);
    }

    // Cálculo do Total
    let total = 0;
    const orderItemsData = items.map((item) => {
      const product = productsInDb.find((p) => p.id === item.productId);
      if (!product) throw new BadRequestException(`Produto ${item.productId} erro.`);
      
      const itemTotal = product.price * item.quantity;
      total += itemTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      };
    });

    // Taxa de 6% (Cartão)
    if (paymentMethod === PaymentMethodDto.CARTAO) {
      total *= 1.06;
    }

    const methodForDb = paymentMethod as unknown as PaymentMethod;

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

      // Desconta do DELIVERY
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
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

  // --- ATUALIZAÇÃO COM EDIÇÃO DE ITENS E ESTOQUE ---
  async update(id: number, updateOrderDto: UpdateOrderDto, userId: number) {
    const currentOrder = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!currentOrder) {
      throw new NotFoundException(`Pedido #${id} não encontrado.`);
    }

    // Se não houver itens para atualizar, faz o update simples
    if (!updateOrderDto.items) {
      // Mas se o método de pagamento mudar, precisamos recalcular o total
      let newTotal = currentOrder.total;
      
      // Se mudou de PIX/DINHEIRO para CARTAO -> Aplica taxa
      // Se mudou de CARTAO para OUTRO -> Remove taxa
      // Essa lógica simples pode falhar se o preço base não for guardado. 
      // O ideal é recalcular tudo se houver mudança de pagamento.
      // Para simplificar aqui: se mudar pagamento E não mandou itens, avisamos que é melhor editar os itens para recalcular.
      // Ou assumimos que o frontend manda os itens sempre que quiser recalculo.
      
      const updatedOrder = await this.prisma.order.update({
        where: { id },
        data: {
          status: updateOrderDto.status,
          clientId: updateOrderDto.clientId,
          deliveryDate: updateOrderDto.deliveryDate,
          observations: updateOrderDto.observations,
          // Não atualizamos total/pagamento aqui sem itens para evitar inconsistência
        },
      });
      
      await this.auditService.createLog(userId, 'UPDATE', 'Order', id, 'Pedido atualizado (Status/Dados).');
      return updatedOrder;
    }

    // --- LÓGICA DE RECALCULO DE ITENS ---
    return this.prisma.$transaction(async (tx) => {
      const newItemsList = updateOrderDto.items || [];
      const oldItemsList = currentOrder.items;
      
      let runningTotal = 0;

      // Mapas para comparação rápida
      // newItemsMap: ProductID -> Quantidade Nova
      const newItemsMap = new Map(newItemsList.map(i => [i.productId, i.quantity]));
      
      // 1. Processar itens ANTIGOS (Remover ou Atualizar)
      for (const oldItem of oldItemsList) {
        const newQty = newItemsMap.get(oldItem.productId);

        if (newQty === undefined) {
          // REMOÇÃO: Item existia, mas não está na nova lista
          // Devolve ao estoque
          await tx.product.update({
            where: { id: oldItem.productId },
            data: { stockDelivery: { increment: oldItem.quantity } }
          });
          // Remove do pedido
          await tx.orderItem.delete({ where: { id: oldItem.id } });
        } else {
          // ATUALIZAÇÃO: Item continua na lista
          const diff = newQty - oldItem.quantity;

          if (diff !== 0) {
            // Se diff > 0: Cliente quer mais (tira do estoque)
            // Se diff < 0: Cliente quer menos (devolve ao estoque)
            
            if (diff > 0) {
              const product = await tx.product.findUnique({ where: { id: oldItem.productId } });
              if (!product || product.stockDelivery < diff) {
                throw new BadRequestException(`Estoque insuficiente para aumentar ${product?.name}.`);
              }
              await tx.product.update({
                where: { id: oldItem.productId },
                data: { stockDelivery: { decrement: diff } }
              });
            } else {
              // Devolve a diferença (positivo)
              await tx.product.update({
                where: { id: oldItem.productId },
                data: { stockDelivery: { increment: Math.abs(diff) } }
              });
            }

            // Atualiza a quantidade no pedido
            await tx.orderItem.update({
              where: { id: oldItem.id },
              data: { quantity: newQty }
            });
          }
          
          // Soma ao novo total (usando preço atual do produto para garantir valor correto)
          const product = await tx.product.findUnique({ where: { id: oldItem.productId } });
          if (product) {
             runningTotal += product.price * newQty;
          }
          
          // Remove do mapa para sabermos o que falta adicionar
          newItemsMap.delete(oldItem.productId);
        }
      }

      // 2. Processar itens NOVOS (Adições)
      for (const [productId, qty] of newItemsMap.entries()) {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) throw new BadRequestException(`Produto ${productId} não encontrado.`);
        
        if (product.stockDelivery < qty) {
           throw new BadRequestException(`Estoque insuficiente para adicionar ${product.name}.`);
        }

        // Tira do estoque
        await tx.product.update({
          where: { id: productId },
          data: { stockDelivery: { decrement: qty } }
        });

        // Cria o item
        await tx.orderItem.create({
          data: {
            orderId: id,
            productId: productId,
            quantity: qty,
            price: product.price
          }
        });

        runningTotal += product.price * qty;
      }

      // 3. Aplica Taxa de Pagamento e Atualiza Pedido
      const method = updateOrderDto.paymentMethod || currentOrder.paymentMethod;
      
      // Se for Cartão, +6%
      if (method === 'CARTAO') {
        runningTotal *= 1.06;
      }

      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          total: runningTotal,
          status: updateOrderDto.status,
          clientId: updateOrderDto.clientId,
          deliveryDate: updateOrderDto.deliveryDate,
          observations: updateOrderDto.observations,
          paymentMethod: method as any
        },
        include: { items: { include: { product: true } } }
      });

      await this.auditService.createLog(userId, 'UPDATE', 'Order', id, `Pedido editado. Novo total: R$ ${runningTotal.toFixed(2)}`);
      
      return updatedOrder;
    });
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

  async getDeliveryStats() {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
    

    const ordersToday = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
        status: { not: 'CANCELADO' },
      },
      select: {
        id: true, total: true, paymentMethod: true, createdAt: true
      },
      orderBy: { createdAt: 'desc' },
    });

    const inventory = await this.prisma.product.findMany({
      select: { id: true, name: true, stockKitchen: true, stockDelivery: true },
      orderBy: { name: 'asc' },
    });

    return { orders: ordersToday, inventory };
  }
}
