import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PdfService } from 'src/pdf/pdf.service';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
  ) {}

  async findOne(id: number, organizationId: number) {
    const report = await this.prisma.monthlyReport.findFirst({
      where: { id, organizationId: Number(organizationId) },
    });
    if (!report) throw new NotFoundException('Relatório não encontrado.');
    return report;
  }

  async findAll(organizationId: number) {
    return this.prisma.monthlyReport.findMany({
      where: { organizationId: Number(organizationId) },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    });
  }

  async createManualReport(month: number, year: number, organizationId: number) {
    const orgId = Number(organizationId);
    if (month < 1 || month > 12) throw new BadRequestException('Mês inválido (1-12)');
    if (year < 2000 || year > 2100) throw new BadRequestException('Ano inválido');

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0); 
    endOfMonth.setHours(23, 59, 59, 999);

    const salesAgg = await this.prisma.order.aggregate({
      _sum: { total: true },
      where: {
        organizationId: orgId,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        status: { not: 'CANCELADO' }
      }
    });

    const expensesAgg = await this.prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        organizationId: orgId,
        date: { gte: startOfMonth, lte: endOfMonth }
      }
    });

    const revenue = Number(salesAgg._sum?.total || 0);
    const expenses = Number(expensesAgg._sum?.amount || 0);
    const profit = revenue - expenses;

    const htmlContent = `
      <h1>Relatório Manual - ${month}/${year}</h1>
      <p><b>Período:</b> ${startOfMonth.toLocaleDateString('pt-BR')} até ${endOfMonth.toLocaleDateString('pt-BR')}</p>
      <hr/>
      <p><b>Faturamento Total:</b> R$ ${revenue.toFixed(2)}</p>
      <p><b>Despesas Totais:</b> R$ ${expenses.toFixed(2)}</p>
      <h2 style="color: ${profit >= 0 ? 'green' : 'red'}"><b>Lucro Líquido:</b> R$ ${profit.toFixed(2)}</h2>
      <br/>
      <small>Gerado manualmente em: ${new Date().toLocaleString('pt-BR')}</small>
    `;

    const pdfBuffer = await this.pdfService.generatePdfFromHtml(htmlContent);
    
    // Remove anterior se existir para esta org e data
    await this.prisma.monthlyReport.deleteMany({
      where: { month, year, organizationId: orgId }
    });

    return this.prisma.monthlyReport.create({
      data: {
        month,
        year,
        totalRevenue: revenue,
        totalExpenses: expenses,
        netProfit: profit,
        pdfData: Buffer.from(pdfBuffer),
        organizationId: orgId
      },
    });
  }
}
