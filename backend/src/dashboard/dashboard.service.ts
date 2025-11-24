import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const productCount = await this.prisma.product.count();
    const userCount = await this.prisma.user.count();
    
    const salesData = await this.getSalesChartData();
    const topProducts = await this.getTopProductsData();
    
    // --- Pedidos Próximos (Mantém a lógica de PENDENTE para alertas) ---
    const today = new Date();
    const next48Hours = new Date();
    next48Hours.setDate(today.getDate() + 2);

    const upcomingOrders = await this.prisma.order.findMany({
      where: {
        status: 'PENDENTE', // Aqui mantemos PENDENTE pois é um alerta de tarefa
        deliveryDate: {
          gte: today,
          lte: next48Hours,
        },
      },
      include: {
        client: { select: { name: true } },
      },
      orderBy: {
        deliveryDate: 'asc',
      },
    });

    return {
      productCount,
      userCount,
      salesData,
      topProducts,
      upcomingOrders,
    };
  }

  // 1. Gráfico de Linha: Vendas CONCLUÍDAS dos últimos 7 dias
  private async getSalesChartData() {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT 
        TO_CHAR("createdAt", 'DD/MM') as date, 
        SUM(total) as amount
      FROM "Order"
      WHERE "createdAt" >= NOW() - INTERVAL '7 days'
      AND status = 'CONCLUÍDO'  -- ALTERAÇÃO AQUI: Apenas concluídos
      GROUP BY TO_CHAR("createdAt", 'DD/MM'), "createdAt"::date
      ORDER BY "createdAt"::date ASC;
    `;
    
    return result.map(item => ({
      date: item.date,
      amount: Number(item.amount)
    }));
  }

  // 2. Gráfico de Pizza: Top 5 Produtos (Apenas de pedidos CONCLUÍDOS)
  private async getTopProductsData() {
    // Mudamos para SQL Puro para conseguir filtrar pelo status do Pedido Pai
    // Fazemos JOIN entre OrderItem, Order e Product
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT 
        p.name as name, 
        SUM(oi.quantity) as value
      FROM "OrderItem" oi
      JOIN "Order" o ON oi."orderId" = o.id
      JOIN "Product" p ON oi."productId" = p.id
      WHERE o.status = 'CONCLUÍDO' -- ALTERAÇÃO AQUI: Apenas pedidos concluídos contam
      GROUP BY p.name
      ORDER BY value DESC
      LIMIT 5;
    `;

    return result.map(item => ({
      name: item.name,
      value: Number(item.value), // Converte BigInt para Number
    }));
  }
}