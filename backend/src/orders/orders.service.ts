import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AuditService } from 'src/audit/audit.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: number, organizationId: string | number) {
    const orgId = Number(organizationId);
    const { items, clientId, observations, paymentMethod, deliveryDate } = createOrderDto;

    // 1. Verificar Limites do Plano
    await this.checkPlanLimits(orgId);

    // 2. Verificar produtos
    const productIds = items.map((item) => item.productId);
    const productsInDb = await this.prisma.product.findMany({ 
      where: { 
        id: { in: productIds },
        organizationId: orgId,
        deletedAt: null
      } 
    });
    
    if (productsInDb.length !== productIds.length) {
      throw new NotFoundException('Alguns produtos não foram encontrados ou não pertencem à sua organização.');
    }

    // 3. Verificar cliente
    if (clientId) {
      const clientExists = await this.prisma.client.findFirst({ 
        where: { id: clientId, organizationId: orgId } 
      });
      if (!clientExists) throw new NotFoundException('Cliente não encontrado nesta organização.');
    }

    // 4. Calcular total
    let total = 0;
    const orderItemsData = items.map((item) => {
      const product = productsInDb.find((p) => p.id === item.productId);
      if (!product) throw new BadRequestException(`Produto ID ${item.productId} inválido.`);
      
      const itemTotal = Number(product.price) * item.quantity;
      total += itemTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      };
    });

    // 5. Criar Pedido
    const order = await this.prisma.order.create({
      data: {
        total,
        observations,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        status: 'PENDENTE',
        paymentMethod: paymentMethod as any, 
        clientId,
        organizationId: orgId,
        userId: userId, // <--- CORREÇÃO 1: Adicionado o ID do criador
        items: {
          create: orderItemsData,
        },
      },
      include: { items: true },
    });

    await this.auditService.createLog(userId, 'CREATE', 'Order', order.id, 'Pedido criado.');
    return order;
  }

  async findAll(organizationId: string | number) {
    const orgId = Number(organizationId);
    return this.prisma.order.findMany({
      where: { 
        organizationId: orgId,
        deletedAt: null 
      },
      include: { 
        items: { include: { product: true } }, 
        client: true 
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, organizationId: string | number) {
    const orgId = Number(organizationId);
    const order = await this.prisma.order.findFirst({
      where: { 
        id, 
        organizationId: orgId,
        deletedAt: null
      },
      include: { 
        items: { include: { product: true } }, 
        client: true 
      },
    });

    if (!order) throw new NotFoundException(`Pedido #${id} não encontrado.`);
    return order;
  }

  async update(id: number, updateOrderDto: UpdateOrderDto, userId: number, organizationId: string | number) {
    const orgId = Number(organizationId);
    await this.findOne(id, orgId);

    const { items, paymentMethod, status, deliveryDate, ...rest } = updateOrderDto;
    
    const dataToUpdate: any = { 
      ...rest,
      status: status as any,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
    };

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: dataToUpdate,
      include: { items: true, client: true }
    });

    await this.auditService.createLog(userId, 'UPDATE', 'Order', id, `Pedido atualizado para status: ${status}`);
    return updatedOrder;
  }

  async remove(id: number, userId: number, organizationId: string | number) {
    const orgId = Number(organizationId);
    await this.findOne(id, orgId);

    await this.prisma.order.update({
      where: { id },
      data: { deletedAt: new Date() }, 
    });
    
    await this.auditService.createLog(userId, 'DELETE', 'Order', id, 'Pedido movido para a lixeira.');
    return { message: 'Pedido removido com sucesso.' };
  }

  // --- CORREÇÃO 2: Adicionada a função removeAll que faltava ---
  async removeAll(userId: number, organizationId: string | number) {
    const orgId = Number(organizationId);
    
    // Apaga (Soft Delete) todos os pedidos daquela organização
    const result = await this.prisma.order.updateMany({
      where: { organizationId: orgId },
      data: { deletedAt: new Date() }
    });

    await this.auditService.createLog(userId, 'DELETE_ALL', 'Order', 0, 'Todos os pedidos foram movidos para a lixeira.');
    
    return { message: `${result.count} pedidos removidos.` };
  }

  private async checkPlanLimits(organizationId: number) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { plan: true } 
    });

    if (!organization) throw new NotFoundException('Organização não encontrada.');

    if (organization.plan === 'PRO') return;

    const LIMITE_FREE = 30;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const ordersCount = await this.prisma.order.count({
      where: {
        organizationId,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        deletedAt: null
      }
    });

    if (ordersCount >= LIMITE_FREE) {
      throw new ForbiddenException(
        `Limite do plano Grátis atingido (${ordersCount}/${LIMITE_FREE}). Faça upgrade para continuar a vender.`
      );
    }
  }
}
