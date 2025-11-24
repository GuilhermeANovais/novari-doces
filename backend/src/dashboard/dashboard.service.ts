// src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const productCount = await this.prisma.product.count();
    const userCount = await this.prisma.user.count();
    
    // Busca os dados dos gráficos (agora excluindo apenas os cancelados)
    const salesData = await this.getSalesChartData();
    const topProducts = await this.getTopProductsData();
    
    // Pedidos Próximos (Apenas Pendentes)
    const today = new Date();
    const next48Hours = new Date();
    next48Hours.setDate(today.getDate() + 2);

    const upcomingOrders = await this.prisma.order.findMany({
      where: {
        status: 'PENDENTE', 
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

  // 1. Gráfico de Linha: Vendas (Exceto Canceladas)
  private async getSalesChartData() {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT 
        TO_CHAR("createdAt", 'DD/MM') as date, 
        SUM(total) as amount
      FROM "Order"
      WHERE "createdAt" >= NOW() - INTERVAL '7 days'
      AND status != 'CANCELADO'  -- <<< ALTERAÇÃO: Conta tudo que NÃO for cancelado
      GROUP BY TO_CHAR("createdAt", 'DD/MM'), "createdAt"::date
      ORDER BY "createdAt"::date ASC;
    `;
    
    return result.map(item => ({
      date: item.date,
      amount: Number(item.amount)
    }));
  }

  // 2. Gráfico de Pizza: Top Produtos (Exceto de pedidos Cancelados)
  private async getTopProductsData() {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT 
        p.name as name, 
        SUM(oi.quantity) as value
      FROM "OrderItem" oi
      JOIN "Order" o ON oi."orderId" = o.id
      JOIN "Product" p ON oi."productId" = p.id
      WHERE o.status != 'CANCELADO' -- <<< ALTERAÇÃO: Ignora produtos de pedidos cancelados
      GROUP BY p.name
      ORDER BY value DESC
      LIMIT 5;
    `;

    return result.map(item => ({
      name: item.name,
      value: Number(item.value),
    }));
  }
}