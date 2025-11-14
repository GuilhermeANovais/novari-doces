// src/orders/orders.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto'; // Este DTO é gerado, mas não o usaremos na lógica de 'create'

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Cria um novo Pedido
   * @param createOrderDto - A lista de itens do pedido
   * @param userId - O ID do usuário logado (virá do token)
   */
  async create(createOrderDto: CreateOrderDto, userId: number) {
    const { items } = createOrderDto;

    // 1. Busque os dados dos produtos do banco de dados
    const productIds = items.map((item) => item.productId);
    const productsInDb = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
    });

    // Verifique se todos os produtos solicitados existem
    if (productsInDb.length !== productIds.length) {
      throw new NotFoundException('Um ou mais produtos não foram encontrados.');
    }

    // 2. Calcule o 'total' e prepare os 'OrderItems'
    let total = 0;
    const orderItemsData = items.map((item) => {
      const product = productsInDb.find((p) => p.id === item.productId);
      
      // Se (por algum motivo) o produto não for encontrado, embora devesse
      if (!product) {
        throw new BadRequestException(`Produto com ID ${item.productId} não encontrado.`);
      }
      
      const itemTotal = product.price * item.quantity;
      total += itemTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price, // Salva o preço no momento da compra
      };
    });

    // 3. Use uma Transação do Prisma
    // Isso garante que ou TUDO funciona, ou NADA é salvo.
    // Se a criação do 'Order' funcionar, mas um 'OrderItem' falhar,
    // o Prisma desfaz a criação do 'Order' (rollback).

    return this.prisma.$transaction(async (tx) => {
      // Crie o Pedido "pai"
      const order = await tx.order.create({
        data: {
          userId: userId,
          total: total,
          status: 'PENDENTE',
        },
      });

      // Crie os Itens do Pedido "filhos"
      await tx.orderItem.createMany({
        data: orderItemsData.map((item) => ({
          ...item,
          orderId: order.id, // Conecte ao Pedido "pai"
        })),
      });

      // Retorne o pedido completo com os itens
      return tx.order.findUnique({
        where: { id: order.id },
        include: {
          items: true, // Inclui os OrderItems
        },
      });
    });
  }

  // Os métodos abaixo foram gerados pelo Nest CLI e podem ser implementados
  
  findAll() {
    // Implementação futura: listar todos os pedidos
    return this.prisma.order.findMany({
      include: {
        user: {
          select: { name: true, email: true }, // Não inclua a senha do usuário
        },
        items: {
          include: {
            product: {
              select: { name: true }, // Mostre o nome do produto
            },
          },
        },
      },
    });
  }

  findOne(id: number) {
    // Implementação futura: buscar um pedido específico
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, email: true },
        },
        items: {
          include: {
            product: {
              select: { name: true, price: true },
            },
          },
        },
      },
    });
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    // A lógica para atualizar apenas o status
    return this.prisma.order.update({
      where: { id: id },
      data: {
        status: updateOrderDto.status,
      },
    });
  }

  remove(id: number) {
    // Usamos uma transação para garantir que ambas as operações funcionem
    return this.prisma.$transaction(async (tx) => {
      // 1. Delete todos os "OrderItems" associados a este Order ID
      await tx.orderItem.deleteMany({
        where: {
          orderId: id,
        },
      });

      // 2. Agora que os "filhos" se foram, delete o "pai" (Order)
      const deletedOrder = await tx.order.delete({
        where: {
          id: id,
        },
      });

      return deletedOrder;
    });
  }
}
