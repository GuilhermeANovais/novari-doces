import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    // Conta quantos produtos existem
    const productCount = await this.prisma.product.count();

    // Conta quantos usuários existem
    const userCount = await this.prisma.user.count();

    // Retorna os dados em um objeto
    return {
      productCount,
      userCount,
    };
  }
}
