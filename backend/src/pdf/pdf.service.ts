import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as puppeteer from 'puppeteer';
// Importamos os tipos do Prisma para garantir a tipagem correta
import { Order, Client, OrderItem, Product } from '@prisma/client';

// Definimos um tipo auxiliar para o pedido com todas as relações carregadas
type FullOrderForPdf = Order & {
  client: Client | null;
  items: (OrderItem & {
    product: Product;
  })[];
};

@Injectable()
export class PdfService {
  constructor(private prisma: PrismaService) {}

  /**
   * Busca os dados do pedido e gera o HTML formatado.
   * Retorna tanto o HTML quanto o objeto do pedido (para usar no nome do arquivo).
   */
  async generateOrderHtml(orderId: number): Promise<{ html: string; order: FullOrderForPdf }> {
    // 1. Busca o pedido completo no banco de dados
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

    // 2. Formatação de Datas e Valores
    const createdDate = new Date(order.createdAt).toLocaleString('pt-BR');

    // Formata a data de entrega (se existir)
    const deliveryDateHtml = order.deliveryDate
      ? `<p><b>Data de Entrega/Retirada:</b> ${new Date(order.deliveryDate).toLocaleString('pt-BR')}</p>`
      : '';

    // 3. Gera as linhas da tabela de itens (HTML)
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
      .join('');

    // 4. Monta o Template HTML Completo
    const html = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Inter', sans-serif; margin: 40px; color: #333; font-size: 14px; }
            
            /* Cabeçalho */
            h1 { color: #1B5E20; margin-bottom: 5px; font-size: 24px; }
            .header { margin-bottom: 30px; border-bottom: 2px solid #1B5E20; padding-bottom: 15px; }
            .header p { margin: 5px 0; font-size: 14px; }
            
            /* Caixas de Detalhes (Cliente e Obs) */
            .details-box { 
              background-color: #f8f9fa; 
              padding: 15px; 
              border-radius: 8px; 
              margin-bottom: 20px;
              border-left: 5px solid #1B5E20;
            }
            .details-box h3 { margin-top: 0; margin-bottom: 10px; color: #1B5E20; font-size: 16px; }
            .details-box p { margin: 5px 0; }

            /* Tabela de Itens */
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border-bottom: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #1B5E20; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            
            /* Rodapé e Totais */
            .total-section { margin-top: 30px; text-align: right; }
            .total-label { font-size: 1.4em; margin-right: 15px; }
            .total-value { font-size: 1.8em; font-weight: bold; color: #1B5E20; }
            
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 20px;}
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Recibo do Pedido #${order.id}</h1>
            <p><b>Data do Pedido:</b> ${createdDate}</p>
            ${deliveryDateHtml}
            <p><b>Status:</b> ${order.status}</p>
          </div>

          <div class="details-box">
            <h3>Dados do Cliente</h3>
            ${
              order.client
                ? `
                <p><b>Nome:</b> ${order.client.name}</p>
                <p><b>Telefone:</b> ${order.client.phone || '—'}</p>
                <p><b>Endereço:</b> ${order.client.address || '—'}</p>
              `
                : '<p><i>Pedido interno (sem cliente associado ao cadastro)</i></p>'
            }
          </div>

          <h3>Itens do Pedido</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 50%">Produto</th>
                <th style="width: 15%">Qtd.</th>
                <th style="width: 15%">Unit.</th>
                <th style="width: 20%">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          ${
            order.observations
              ? `
            <div class="details-box" style="margin-top: 25px; border-left-color: #00b8c5ff;">
              <h3 style="color: #00b8c5ff;">Observações</h3>
              <p>${order.observations}</p>
            </div>
          `
              : ''
          }
          
          <div class="total-section">
            <span class="total-label">Total a Pagar:</span>
            <span class="total-value">R$ ${order.total.toFixed(2)}</span>
          </div>

          <div class="footer">
            Obrigado pela preferência!
          </div>
        </body>
      </html>
    `;

    return { html, order };
  }

  /**
   * Gera o PDF a partir do HTML usando o Puppeteer.
   * Retorna Uint8Array (compatível com versões novas do Puppeteer e com o res.send do Express)
   */
  async generatePdfFromHtml(html: string): Promise<Uint8Array> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // Importante para rodar em alguns servidores
    });

    const page = await browser.newPage();

    // Define o conteúdo da página
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Gera o PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    });

    await browser.close();

    return pdfBuffer;
  }
}
