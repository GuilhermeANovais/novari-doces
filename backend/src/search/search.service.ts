import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async searchGlobal(query: string, organizationId: number) {
    if (!query || query.length < 2) {
      return { clients: [], orders: [], products: [] };
    }

    const searchTerm = query.trim();
    const orgId = Number(organizationId); // Garante número

    const [clients, orders, products] = await Promise.all([
      // 1. Clientes
      this.prisma.client.findMany({
        where: {
          organizationId: orgId,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { phone: { contains: searchTerm } },
          ],
        },
        take: 5,
      }),

      // 2. Pedidos
      this.prisma.order.findMany({
        where: {
          organizationId: orgId,
          OR: [
            ...(!isNaN(Number(searchTerm)) ? [{ id: Number(searchTerm) }] : []),
            { client: { name: { contains: searchTerm, mode: 'insensitive' } } },
          ],
        },
        include: { client: { select: { name: true } } },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),

      // 3. Produtos
      this.prisma.product.findMany({
        where: {
          organizationId: orgId,
          name: { contains: searchTerm, mode: 'insensitive' },
        },
        take: 5,
      }),
    ]);

    return { clients, orders, products };
  }
}
