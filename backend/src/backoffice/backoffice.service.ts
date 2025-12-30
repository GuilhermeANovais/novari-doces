import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BackofficeService {
  constructor(private prisma: PrismaService) {}

  async listAllCompanies() {
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
        users: {
          where: { role: 'ADMIN' },
          take: 1,
          select: { email: true, name: true }
        }
      }
    });

    return companies.map(comp => ({
      id: comp.id.toString(),
      name: comp.name,
      createdAt: comp.createdAt,
      plan: comp.plan, // <--- ADICIONE ISTO (Enviar o plano atual)
      adminEmail: comp.users[0]?.email || 'N/A',
      adminName: comp.users[0]?.name || 'N/A',
      stats: {
        users: comp._count.users,
        orders: comp._count.orders,
        products: comp._count.products
      }
    }));
  }

  // --- NOVA FUNÇÃO: Mudar Plano ---
  async togglePlan(organizationId: string, newPlan: 'FREE' | 'PRO') {

    const idAsNumber = Number(organizationId);

    return this.prisma.organization.update({
      where: { id: idAsNumber },
      data: { plan: newPlan },
    });
  }

  async deleteCompany(organizationId: string) {
    // Simulação por segurança
    return { message: `Simulação: Empresa ${organizationId} seria apagada.` };
  }
}
