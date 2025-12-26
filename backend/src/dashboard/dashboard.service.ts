import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(organizationId: number) {
    const orgId = Number(organizationId);

    const productCount = await this.prisma.product.count({ where: { organizationId: orgId, deletedAt: null } });
    // User count geralmente é global ou da org, assumindo org:
    const userCount = await this.prisma.user.count({ where: { organizationId: orgId } });
    
    const salesData = await this.getSalesChartData(orgId);
    const topProducts = await this.getTopProductsData(orgId);
    const expensesData = await this.getExpensesChartData(orgId);
    const financials = await this.getMonthlyFinancials(orgId);

    const today = new Date();
    const next48Hours = new Date();
    next48Hours.setDate(today.getDate() + 2);

    const upcomingOrders = await this.prisma.order.findMany({
      where: {
        organizationId: orgId,
        status: 'PENDENTE', 
        deliveryDate: { gte: today, lte: next48Hours },
      },
      include: { client: { select: { name: true } } },
      orderBy: { deliveryDate: 'asc' },
    });

    return {
      productCount,
      userCount,
      salesData,
      topProducts,
      expensesData,
      upcomingOrders,
      ...financials,
    };
  }

  private async getSalesChartData(orgId: number) {
    // Queries Raw são complexas para injetar parâmetros dinâmicos de forma segura em Strings
    // Idealmente use prisma.$queryRaw com parâmetros. Aqui ajustarei para Prisma API normal se possível, 
    // ou manter raw assumindo segurança (Cuidado com SQL Injection se orgId não for number).
    // Como convertemos para Number(orgId), é seguro.
    
    // Nota: Simplificando para Prisma API para evitar erro de sintaxe SQL em diferentes DBs
    // Mas se quiser manter raw, precisaria injetar WHERE "organizationId" = ${orgId}
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT 
        TO_CHAR("createdAt" AT TIME ZONE 'America/Sao_Paulo', 'DD/MM') as date, 
        SUM(total) as amount
      FROM "Order"
      WHERE "createdAt" >= NOW() - INTERVAL '7 days' 
        AND status != 'CANCELADO'
        AND "organizationId" = ${orgId}
      GROUP BY 
        TO_CHAR("createdAt" AT TIME ZONE 'America/Sao_Paulo', 'DD/MM'), 
        ("createdAt" AT TIME ZONE 'America/Sao_Paulo')::date
      ORDER BY 
        ("createdAt" AT TIME ZONE 'America/Sao_Paulo')::date ASC;
    `;
    return result.map(i => ({ date: i.date, amount: Number(i.amount) }));
  }

  private async getExpensesChartData(orgId: number) {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT 
        TO_CHAR("date" AT TIME ZONE 'America/Sao_Paulo', 'DD/MM') as date, 
        SUM(amount) as amount
      FROM "Expense"
      WHERE "date" >= NOW() - INTERVAL '30 days'
        AND "organizationId" = ${orgId}
      GROUP BY 
        TO_CHAR("date" AT TIME ZONE 'America/Sao_Paulo', 'DD/MM'), 
        ("date" AT TIME ZONE 'America/Sao_Paulo')::date
      ORDER BY 
        ("date" AT TIME ZONE 'America/Sao_Paulo')::date ASC;
    `;
    return result.map(i => ({ date: i.date, amount: Number(i.amount) }));
  }

  private async getTopProductsData(orgId: number) {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT p.name as name, SUM(oi.quantity) as value
      FROM "OrderItem" oi
      JOIN "Order" o ON oi."orderId" = o.id
      JOIN "Product" p ON oi."productId" = p.id
      WHERE o.status != 'CANCELADO' 
        AND o."organizationId" = ${orgId}
      GROUP BY p.name
      ORDER BY value DESC LIMIT 5;
    `;
    return result.map(i => ({ name: i.name, value: Number(i.value) }));
  }

  private async getMonthlyFinancials(orgId: number) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const salesAgg = await this.prisma.order.aggregate({
      _sum: { total: true },
      where: {
        organizationId: orgId,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        status: { not: 'CANCELADO' }
      }
    });

    const expensesAgg = await this.prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        organizationId: orgId,
        date: { gte: startOfMonth, lte: endOfMonth }
      }
    });

    const revenueMonth = Number(salesAgg._sum?.total || 0);
    const expensesMonth = Number(expensesAgg._sum?.amount || 0);

    return { 
      revenueMonth, 
      expensesMonth, 
      netProfit: revenueMonth - expensesMonth 
    };
  }
}
