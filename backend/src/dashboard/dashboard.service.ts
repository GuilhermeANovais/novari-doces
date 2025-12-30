import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(organizationId: number | string) {
    const orgId = Number(organizationId);

    // 1. Buscar o Plano
    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { plan: true }
    });

    const currentPlan = organization?.plan || 'FREE';

    // 2. Contadores básicos (Ignorando deletados)
    const productCount = await this.prisma.product.count({
      where: { organizationId: orgId, deletedAt: null }
    });
    
    const userCount = await this.prisma.user.count({
      where: { organizationId: orgId }
    });
    
    // 3. Lógica do Plano: Contar pedidos do mês atual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const usage = await this.prisma.order.count({
      where: {
        organizationId: orgId,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        deletedAt: null // <--- IMPORTANTE: Pedidos excluídos não contam para o limite
      }
    });

    const limit = currentPlan === 'FREE' ? 30 : 'Ilimitado';

    // 4. Dados Financeiros
    const financials = await this.getMonthlyFinancials(orgId);
    
    const salesData = await this.getSalesChartData(orgId);
    const topProducts = await this.getTopProductsData(orgId);
    const expensesData = await this.getExpensesChartData(orgId);

    // 5. Pedidos Próximos
    const today = new Date();
    const next48Hours = new Date();
    next48Hours.setDate(today.getDate() + 2);

    const upcomingOrders = await this.prisma.order.findMany({
      where: {
        organizationId: orgId,
        status: 'PENDENTE', 
        deliveryDate: { gte: today, lte: next48Hours },
        deletedAt: null // <--- Não mostrar pedidos excluídos
      },
      include: { client: { select: { name: true } } },
      orderBy: { deliveryDate: 'asc' },
      take: 5 
    });

    return {
      productCount,
      userCount,
      salesData,
      topProducts,
      expensesData,
      upcomingOrders,
      ...financials,
      plan: currentPlan,
      usage,
      limit
    };
  }

  // --- Métodos Privados Auxiliares ---

  private async getTopProductsData(orgId: number) {
    // CORREÇÃO: Adicionado filtro de deletedAt na query SQL pura
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT p.name as name, SUM(oi.quantity) as value
      FROM "OrderItem" oi
      JOIN "Order" o ON oi."orderId" = o.id
      JOIN "Product" p ON oi."productId" = p.id
      WHERE o.status != 'CANCELADO' 
      AND o."organizationId" = ${orgId}
      AND o."deletedAt" IS NULL 
      GROUP BY p.name
      ORDER BY value DESC LIMIT 5;
    `;
    
    return result.map(i => ({ name: i.name, value: Number(i.value) }));
  }

  private async getMonthlyFinancials(orgId: number) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // CORREÇÃO: Adicionado deletedAt: null
    const salesAgg = await this.prisma.order.aggregate({
      _sum: { total: true },
      where: {
        organizationId: orgId,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        status: { not: 'CANCELADO' },
        deletedAt: null // <--- O SEGREDO ESTÁ AQUI
      }
    });

    const expensesAgg = await this.prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        organizationId: orgId,
        date: { gte: startOfMonth, lte: endOfMonth }
        // Despesas geralmente não têm soft delete implementado da mesma forma, 
        // mas se tiverem, adicione aqui também.
      }
    });

    const revenue = Number(salesAgg._sum.total || 0);
    const expenses = Number(expensesAgg._sum.amount || 0);

    return {
      revenue,
      expenses,
      profit: revenue - expenses
    };
  }

  private async getSalesChartData(orgId: number) {
    return []; 
  }

  private async getExpensesChartData(orgId: number) {
    return [];
  }
}
