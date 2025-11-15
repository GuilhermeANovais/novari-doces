// src/orders/orders.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Cria um novo Pedido
   * @param createOrderDto - A lista de itens e os dados do pedido
   * @param userId - O ID do usuário logado (funcionário)
   */
  async create(createOrderDto: CreateOrderDto, userId: number) {
    // 1. Desestruture todos os campos do DTO
    const { items, clientId, observations } = createOrderDto;

    // --- Validação (Itens) ---
    const productIds = items.map((item) => item.productId);
    const productsInDb = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
    });

    if (productsInDb.length !== productIds.length) {
      throw new NotFoundException('Um ou mais produtos não foram encontrados.');
    }

    // --- Validação (Cliente) ---
    if (clientId) {
      const clientExists = await this.prisma.client.findUnique({
        where: { id: clientId },
      });
      if (!clientExists) {
        throw new NotFoundException(`Cliente com ID ${clientId} não encontrado.`);
      }
    }

    // --- Cálculo (Total e Itens) ---
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
        price: product.price, // Salva o preço no momento da compra
      };
    });

    // --- Transação (Criação) ---
    return this.prisma.$transaction(async (tx) => {
      // Crie o Pedido "pai"
      const order = await tx.order.create({
        data: {
          userId: userId,
          total: total,
          status: 'PENDENTE',
          observations: observations, // <-- CAMPO NOVO
          clientId: clientId,       // <-- CAMPO NOVO
        },
      });

      // Crie os Itens do Pedido "filhos"
      await tx.orderItem.createMany({
        data: orderItemsData.map((item) => ({
          ...item,
          orderId: order.id, // Conecte ao Pedido "pai"
        })),
      });

      // Retorne o pedido completo
      return tx.order.findUnique({
        where: { id: order.id },
        include: {
          items: true,
          client: true, // Inclua os dados do cliente
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
          select: { name: true, email: true } // Não inclua a senha do usuário
        },
        client: { // Inclua os dados do cliente
          select: { name: true, phone: true }
        },
        items: {
          include: {
            product: {
              select: { name: true } // Mostre o nome do produto
            }
          }
        }
      }
    });
  }

  findOne(id: number) {
    // Implementação futura: buscar um pedido específico
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, email: true }
        },
        client: {
          select: { name: true, phone: true, address: true }
        },
        items: {
          include: {
            product: {
              select: { name: true, price: true }
            }
          }
        }
      }
    });
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    // Implementação: atualizar o status
    return this.prisma.order.update({
      where: { id: id },
      data: {
        status: updateOrderDto.status,
      },
    });
  }

  remove(id: number) {
    // Implementação: deletar o pedido e seus itens
    return this.prisma.$transaction(async (tx) => {
      // 1. Delete todos os "OrderItems" associados
      await tx.orderItem.deleteMany({
        where: {
          orderId: id,
        },
      });

      // 2. Delete o "Order"
      const deletedOrder = await tx.order.delete({
        where: {
          id: id,
        },
      });

      return deletedOrder;
    });
  }
}