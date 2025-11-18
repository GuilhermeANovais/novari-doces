// src/pdf/pdf.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PdfService {
  constructor(private prisma: PrismaService) {}

  /**
   * Busca um pedido e gera um HTML para ele
   */
  async generateOrderHtml(orderId: number): Promise<string> {
    // 1. Busque o pedido completo (como fizemos no findOne do OrdersService)
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // 2. Gere os 'items' do HTML
    const itemsHtml = order.items
      .map(
        (item) => `
      <tr>
        <td>${item.product.name}</td>
        <td>${item.quantity}</td>
        <td>R$ ${item.price.toFixed(2)}</td>
        <td>R$ ${(item.quantity * item.price).toFixed(2)}</td>
      </tr>
    `,
      )
      .join(''); // Junta todas as linhas da tabela

    // 3. Gere o template HTML completo
    // (Isto é CSS inline básico para garantir que o PDF o entenda)
    return `
      <html>
        <head>
          <style>
            body { font-family: Times New Roman, serif; margin: 40px; }
            h1 { color: #8f1e85ff; } /* Verde Escuro */
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { font-size: 1.2em; font-weight: bold; margin-top: 20px; text-align: right; }
            .header { margin-bottom: 30px; }
            .client-details { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px;}
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Recibo do Pedido #${order.id}</h1>
            <p>Data: ${new Date(order.createdAt).toLocaleString('pt-BR')}</p>
            <p>Status: ${order.status}</p>
          </div>

          ${
            order.client
              ? `
            <div class="client-details">
              <h3>Detalhes do Cliente</h3>
              <p><b>Nome:</b> ${order.client.name}</p>
              <p><b>Telefone:</b> ${order.client.phone || 'N/A'}</p>
              <p><b>Endereço:</b> ${order.client.address || 'N/A'}</p>
            </div>
          `
              : '<p>Pedido interno (sem cliente associado)</p>'
          }

          <h3>Itens do Pedido</h3>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Qtd.</th>
                <th>Preço Unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          ${
            order.observations
              ? `
            <div class="client-details">
              <h3>Observações</h3>
              <p>${order.observations}</p>
            </div>
          `
              : ''
          }
          
          <div class="total">
            Total do Pedido: R$ ${order.total.toFixed(2)}
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Gera o PDF a partir do HTML
   */
  async generatePdfFromHtml(html: string): Promise<Uint8Array> {
    const browser = await puppeteer.launch({
      headless: true,
      // Adicione isto se estiver a ter problemas no Linux/Docker
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    
    // Define o conteúdo da página como o nosso HTML
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Gera o PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '40px',
        right: '40px',
        bottom: '40px',
        left: '40px',
      },
    });

    await browser.close();
    return pdfBuffer;
  }
}