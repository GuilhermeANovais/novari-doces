import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BackofficeService {
  constructor(private prisma: PrismaService) {}

  async listAllCompanies() {
    // Busca todas as organizações e conta quantos users/orders elas têm
    const companies = await this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { 
            users: true, 
            orders: true,
            products: true
          }
        },
        // Opcional: Pegar o email do Admin (primeiro user criado)
        users: {
          where: { role: 'ADMIN' },
          take: 1,
          select: { email: true, name: true }
        }
      }
    });

    // Formata o retorno para ser mais limpo no frontend
    return companies.map(comp => ({
      id: comp.id,
      name: comp.name,
      createdAt: comp.createdAt,
      adminEmail: comp.users[0]?.email || 'N/A',
      adminName: comp.users[0]?.name || 'N/A',
      stats: {
        users: comp._count.users,
        orders: comp._count.orders,
        products: comp._count.products
      }
    }));
  }

  // Suspender/Apagar empresa (Futuro)
  async deleteCompany(organizationId: string) {
    // CUIDADO: Isto apagaria tudo (Cascade). 
    // Por enquanto vamos só retornar um aviso.
    return { message: `Simulação: Empresa ${organizationId} seria apagada.` };
  }
}
