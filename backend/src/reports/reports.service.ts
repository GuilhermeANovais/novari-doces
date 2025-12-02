import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PdfService } from 'src/pdf/pdf.service';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService, // <--- Injetar o serviço de PDF
  ) {}

  async findAll() {
    return this.prisma.monthlyReport.findMany({
      orderBy: { year: 'desc', month: 'desc' } as any, // Ajuste conforme a versão do prisma
    });
  }

  // --- NOVA FUNÇÃO: GERAR MANUALMENTE ---
  async createManualReport(month: number, year: number) {
    // 1. Validação básica
    if (month < 1 || month > 12) throw new BadRequestException('Mês inválido (1-12)');
    if (year < 2000 || year > 2100) throw new BadRequestException('Ano inválido');

    // 2. Definir o intervalo de datas
    // Mês 11 (Novembro) => start: 2025-11-01, end: 2025-11-30
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0); // Dia 0 do mês seguinte = último deste mês
    endOfMonth.setHours(23, 59, 59, 999);

    // 3. Buscar Vendas
    const salesAgg = await this.prisma.order.aggregate({
      _sum: { total: true },
      where: {
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        status: { not: 'CANCELADO' }
      }
    });

    // 4. Buscar Despesas
    const expensesAgg = await this.prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        date: { gte: startOfMonth, lte: endOfMonth }
      }
    });

    const revenue = salesAgg._sum.total || 0;
    const expenses = expensesAgg._sum.amount || 0;
    const profit = revenue - expenses;

    // 5. Gerar PDF
    const htmlContent = `
      <h1>Relatório Mensal - ${month}/${year}</h1>
      <p><b>Período:</b> ${startOfMonth.toLocaleDateString('pt-BR')} até ${endOfMonth.toLocaleDateString('pt-BR')}</p>
      <hr/>
      <p><b>Faturamento Total:</b> R$ ${revenue.toFixed(2)}</p>
      <p><b>Despesas Totais:</b> R$ ${expenses.toFixed(2)}</p>
      <h2 style="color: ${profit >= 0 ? 'green' : 'red'}"><b>Lucro Líquido:</b> R$ ${profit.toFixed(2)}</h2>
      <br/>
      <small>Gerado manualmente em: ${new Date().toLocaleString('pt-BR')}</small>
    `;

    const pdfBuffer = await this.pdfService.generatePdfFromHtml(htmlContent);

    // 6. Salvar (Usamos upsert para substituir se já existir)
    // Precisamos encontrar um jeito de identificar unicamente. 
    // Como o prisma não tem 'upsert' fácil sem @unique composto no schema, vamos tentar deletar e criar.
    
    // Remove se já existir um relatório desse mês/ano
    await this.prisma.monthlyReport.deleteMany({
      where: { month, year }
    });

    return this.prisma.monthlyReport.create({
      data: {
        month,
        year,
        totalRevenue: revenue,
        totalExpenses: expenses,
        netProfit: profit,
        pdfData: Buffer.from(pdfBuffer),
      },
    });
  }
}
