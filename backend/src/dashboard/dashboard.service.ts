import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const productCount = await this.prisma.product.count();
    const userCount = await this.prisma.user.count();
    
    // Dados dos Gráficos
    const salesData = await this.getSalesChartData();
    const topProducts = await this.getTopProductsData();
    const expensesData = await this.getExpensesChartData();

    // Dados Financeiros
    const financials = await this.getMonthlyFinancials();

    // Pedidos Próximos (Lógica corrigida para garantir datas locais)
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
      expensesData,
      upcomingOrders,
      ...financials,
    };
  }

  // --- CORREÇÃO DE TIMEZONE AQUI ---
  // Adicionei "AT TIME ZONE 'America/Sao_Paulo'" para alinhar os dias com o Brasil

  private async getSalesChartData() {
    // Nota: O ::date no final garante que ordenamos corretamente
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT 
        TO_CHAR("createdAt" AT TIME ZONE 'America/Sao_Paulo', 'DD/MM') as date, 
        SUM(total) as amount
      FROM "Order"
      WHERE "createdAt" >= NOW() - INTERVAL '7 days' 
        AND status != 'CANCELADO'
      GROUP BY 
        TO_CHAR("createdAt" AT TIME ZONE 'America/Sao_Paulo', 'DD/MM'), 
        ("createdAt" AT TIME ZONE 'America/Sao_Paulo')::date
      ORDER BY 
        ("createdAt" AT TIME ZONE 'America/Sao_Paulo')::date ASC;
    `;
    return result.map(i => ({ date: i.date, amount: Number(i.amount) }));
  }

  private async getExpensesChartData() {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT 
        TO_CHAR("date" AT TIME ZONE 'America/Sao_Paulo', 'DD/MM') as date, 
        SUM(amount) as amount
      FROM "Expense"
      WHERE "date" >= NOW() - INTERVAL '30 days'
      GROUP BY 
        TO_CHAR("date" AT TIME ZONE 'America/Sao_Paulo', 'DD/MM'), 
        ("date" AT TIME ZONE 'America/Sao_Paulo')::date
      ORDER BY 
        ("date" AT TIME ZONE 'America/Sao_Paulo')::date ASC;
    `;
    return result.map(i => ({ date: i.date, amount: Number(i.amount) }));
  }

  // A query de Top Produtos não precisa de timezone pois agrupa por nome
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

  // Para os totais do mês, usamos JavaScript Date que já converte se o servidor estiver configurado,
  // mas idealmente também usarias queries raw se precisares de precisão absoluta de calendário.
  private async getMonthlyFinancials() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const salesAgg = await this.prisma.order.aggregate({
      _sum: { total: true },
      where: {
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        status: { not: 'CANCELADO' }
      }
    });

    const expensesAgg = await this.prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        date: { gte: startOfMonth, lte: endOfMonth }
      }
    });

    const revenueMonth = salesAgg._sum.total || 0;
    const expensesMonth = expensesAgg._sum.amount || 0;

    return { 
      revenueMonth, 
      expensesMonth, 
      netProfit: revenueMonth - expensesMonth 
    };
  }
}
