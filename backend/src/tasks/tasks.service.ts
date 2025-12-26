import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { PdfService } from 'src/pdf/pdf.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
  ) {}

  // Roda no dia 1 de cada mês à meia-noite
  @Cron('0 0 1 * *') 
  async handleMonthlyClosing() {
    this.logger.log('Iniciando fechamento mensal automático para todas as organizações...');

    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const month = startOfLastMonth.getMonth() + 1;
    const year = startOfLastMonth.getFullYear();

    // 1. Busca todas as organizações
    const organizations = await this.prisma.organization.findMany();

    for (const org of organizations) {
      this.logger.log(`Gerando relatório ${month}/${year} para Organização ID: ${org.id}`);

      // 2. Busca Vendas da Organização
      const salesAgg = await this.prisma.order.aggregate({
        _sum: { total: true },
        where: {
          organizationId: org.id,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          status: { not: 'CANCELADO' }
        }
      });

      // 3. Busca Despesas da Organização
      const expensesAgg = await this.prisma.expense.aggregate({
        _sum: { amount: true },
        where: {
          organizationId: org.id,
          date: { gte: startOfLastMonth, lte: endOfLastMonth }
        }
      });

      const revenue = Number(salesAgg._sum?.total || 0);
      const expenses = Number(expensesAgg._sum?.amount || 0);
      const profit = revenue - expenses;

      const htmlContent = `
        <h1>Fechamento Mensal - ${month}/${year}</h1>
        <p><b>Organização:</b> ${org.name}</p>
        <p><b>Faturamento:</b> R$ ${revenue.toFixed(2)}</p>
        <p><b>Despesas:</b> R$ ${expenses.toFixed(2)}</p>
        <hr/>
        <h2><b>Lucro Líquido:</b> R$ ${profit.toFixed(2)}</h2>
      `;

      const pdfBuffer = await this.pdfService.generatePdfFromHtml(htmlContent);

      // 4. Salva o Relatório vinculado à Organização
      await this.prisma.monthlyReport.create({
        data: {
          month,
          year,
          totalRevenue: revenue,
          totalExpenses: expenses,
          netProfit: profit,
          pdfData: Buffer.from(pdfBuffer),
          organizationId: org.id,
        },
      });
    }

    this.logger.log('Fechamento mensal concluído.');
  }
}
