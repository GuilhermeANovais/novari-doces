import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const productCount = await this.prisma.product.count();
    const userCount = await this.prisma.user.count();
    
    // Dados dos Gráficos
    const salesData = await this.getSalesChartData(); // Últimos 7 dias
    const topProducts = await this.getTopProductsData();
    const expensesData = await this.getExpensesChartData(); // Novo: Últimos 30 dias de despesas

    // Dados Financeiros do Mês Atual (Para os Cards)
    const financials = await this.getMonthlyFinancials();

    // Pedidos Próximos
    const today = new Date();
    const next48Hours = new Date();
    next48Hours.setDate(today.getDate() + 2);

    const upcomingOrders = await this.prisma.order.findMany({
      where: {
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
      expensesData, // Novo
      upcomingOrders,
      ...financials, // Espalha: revenueMonth, expensesMonth, netProfit
    };
  }

  // --- QUERIES EXISTENTES ---
  private async getSalesChartData() {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT TO_CHAR("createdAt", 'DD/MM') as date, SUM(total) as amount
      FROM "Order"
      WHERE "createdAt" >= NOW() - INTERVAL '7 days' AND status != 'CANCELADO'
      GROUP BY TO_CHAR("createdAt", 'DD/MM'), "createdAt"::date
      ORDER BY "createdAt"::date ASC;
    `;
    return result.map(i => ({ date: i.date, amount: Number(i.amount) }));
  }

  private async getTopProductsData() {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT p.name as name, SUM(oi.quantity) as value
      FROM "OrderItem" oi
      JOIN "Order" o ON oi."orderId" = o.id
      JOIN "Product" p ON oi."productId" = p.id
      WHERE o.status != 'CANCELADO'
      GROUP BY p.name
      ORDER BY value DESC LIMIT 5;
    `;
    return result.map(i => ({ name: i.name, value: Number(i.value) }));
  }

  // --- NOVAS QUERIES ---

  // 1. Gráfico de Despesas (Últimos 30 dias)
  private async getExpensesChartData() {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT TO_CHAR("date", 'DD/MM') as date, SUM(amount) as amount
      FROM "Expense"
      WHERE "date" >= NOW() - INTERVAL '30 days'
      GROUP BY TO_CHAR("date", 'DD/MM'), "date"::date
      ORDER BY "date"::date ASC;
    `;
    return result.map(i => ({ date: i.date, amount: Number(i.amount) }));
  }

  // 2. Totais do Mês Atual (Vendas, Despesas, Lucro)
  private async getMonthlyFinancials() {
    // Pegamos o primeiro e último dia do mês atual
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    // Soma Vendas (Concluídas + Pendentes, exceto Canceladas)
    const salesAgg = await this.prisma.order.aggregate({
      _sum: { total: true },
      where: {
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        status: { not: 'CANCELADO' }
      }
    });

    // Soma Despesas
    const expensesAgg = await this.prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        date: { gte: startOfMonth, lte: endOfMonth }
      }
    });

    const revenueMonth = salesAgg._sum.total || 0;
    const expensesMonth = expensesAgg._sum.amount || 0;
    const netProfit = revenueMonth - expensesMonth;

    return { revenueMonth, expensesMonth, netProfit };
  }
}