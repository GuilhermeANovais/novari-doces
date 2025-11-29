import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule'; // Removido CronExpression pois usamos string direta
import { PrismaService } from 'src/prisma/prisma.service';
import { PdfService } from 'src/pdf/pdf.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
  ) {}

  // --- TAREFA 1: Fechamento Mensal (Dia 1 às 00:00) ---
  @Cron('0 0 1 * *') 
  async handleMonthlyClosing() {
    this.logger.log('Iniciando fechamento mensal automático...');

    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const month = startOfLastMonth.getMonth() + 1;
    const year = startOfLastMonth.getFullYear();

    this.logger.log(`Gerando relatório para: ${month}/${year}`);

    // Buscar Vendas
    const salesAgg = await this.prisma.order.aggregate({
      _sum: { total: true },
      where: {
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        status: { not: 'CANCELADO' }
      }
    });

    // Buscar Despesas
    const expensesAgg = await this.prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        date: { gte: startOfLastMonth, lte: endOfLastMonth }
      }
    });

    const revenue = salesAgg._sum.total || 0;
    const expenses = expensesAgg._sum.amount || 0;
    const profit = revenue - expenses;

    const htmlContent = `
      <h1>Fechamento Mensal - ${month}/${year}</h1>
      <p><b>Faturamento:</b> R$ ${revenue.toFixed(2)}</p>
      <p><b>Despesas:</b> R$ ${expenses.toFixed(2)}</p>
      <hr/>
      <h2><b>Lucro Líquido:</b> R$ ${profit.toFixed(2)}</h2>
    `;

    const pdfBuffer = await this.pdfService.generatePdfFromHtml(htmlContent);

    await this.prisma.monthlyReport.create({
      data: {
        month,
        year,
        totalRevenue: revenue,
        totalExpenses: expenses,
        netProfit: profit,
        pdfData: Buffer.from(pdfBuffer),
      },
    });

    this.logger.log('Relatório mensal gerado e salvo com sucesso!');
  }

  // --- TAREFA 2: Limpeza do Mural (Diariamente às 21:00) ---
  // Zera o mural no final do expediente.
  @Cron('0 21 * * *')
  async pruneNoticeBoard() {
    this.logger.log('🧹 Executando limpeza diária do Mural (21:00)...');

    // Remove TODOS os avisos (reset diário)
    const { count } = await this.prisma.notice.deleteMany({});

    if (count > 0) {
      this.logger.log(`✅ Mural limpo: ${count} avisos foram removidos.`);
    } else {
      this.logger.log('✅ Mural verificado: Nenhum aviso para remover.');
    }
  }
}
