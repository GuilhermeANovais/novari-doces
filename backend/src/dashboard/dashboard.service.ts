import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {

    const productCount = await this.prisma.product.count();
    const userCount = await this.prisma.user.count();

    const salesData = await this.getSalesChartData();
    const topProducts = await this.getTopProductsData();

    // Retorna os dados em um objeto
    return {
      productCount,
      userCount,
      salesData,
      topProducts,
    };
  }

  private async getSalesChartData() {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT
        TO_CHAR("createdAt", 'DD/MM') as date,
        SUM(total) as amount
      FROM "Order"
      WHERE "createdAt" >= NOW() - INTERVAL '7 days'
      AND status != 'CANCELADO'
      GROUP BY TO_CHAR("createdAt", 'DD/MM'), "createdAt"::date
      ORDER BY "createdAt"::date ASC;
      `;

      return result.map(item => ({
        date: item.date,
        amount: Number(item.amount)
    }));
  }

  private async getTopProductsData() {
    // Agrupa itens vendidos por produto e soma a quantidade
    const grouped = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5, // Top 5
    });

    // Precisamos buscar os nomes dos produtos (o groupBy não faz join automático)
    const productIds = grouped.map(g => g.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    // Junta o nome com a quantidade
    return grouped.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        name: product?.name || 'Desconhecido',
        value: item._sum.quantity || 0,
      };
    });
  }
}
