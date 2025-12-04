import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as puppeteer from 'puppeteer';
import { Order, Client, OrderItem, Product } from '@prisma/client';

type FullOrderForPdf = Order & {
  client: Client | null;
  items: (OrderItem & {
    product: Product;
  })[];
};

@Injectable()
export class PdfService {
  constructor(private prisma: PrismaService) {}

  // --- 1. Método Principal para Pedidos (Chamado pelo Controller) ---
  async generatePdf(orderId: number, type: 'receipt' | 'kitchen'): Promise<{ buffer: Uint8Array; filename: string }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        items: { include: { product: true } },
      },
    });

    if (!order) throw new NotFoundException('Pedido não encontrado');

    const html = type === 'receipt' 
      ? this.getReceiptHtml(order) 
      : this.getKitchenHtml(order);

    // Opções do PDF
    const options = type === 'receipt' 
      ? { width: '80mm', printBackground: true, margin: { top: '5mm', right: '2mm', bottom: '5mm', left: '2mm' } }
      : { format: 'A4', printBackground: true, margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' } };

    const buffer = await this.generatePdfFromHtml(html, options);

    // Nome do arquivo
    const date = new Date(order.createdAt);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const prefix = type === 'receipt' ? 'cupom' : 'pedido';
    const filename = `${prefix}_#${order.id}_${dateStr}.pdf`;

    return { buffer, filename };
  }

  // --- 2. Método Genérico (Chamado pelo TasksService e internamente) ---
  async generatePdfFromHtml(html: string, options: any = {}): Promise<Uint8Array> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Se não passar opções (ex: relatório mensal), usa A4 padrão
    const finalOptions = Object.keys(options).length > 0 ? options : {
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    };

    const pdfBuffer = await page.pdf(finalOptions);
    await browser.close();
    return pdfBuffer;
  }

  // --- Templates Privados (Sem deliveryDate) ---

  private getReceiptHtml(order: FullOrderForPdf): string {
    const createdDate = new Date(order.createdAt).toLocaleString('pt-BR');
    const itemsHtml = order.items.map(item => `
      <div class="item-row">
        <div class="item-name">${item.quantity}x ${item.product.name}</div>
        <div class="item-price">R$ ${(item.quantity * item.price).toFixed(2)}</div>
      </div>
    `).join('');

    return `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; width: 100%; padding: 5px; }
            .text-center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .item-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .item-name { flex: 1; margin-right: 10px; }
            .total-section { margin-top: 10px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header text-center">
            <div class="brand" style="font-size: 16px; font-weight: bold;">CONFEITARIA HEAVEN</div>
            <div>Pedido #${order.id}</div>
            <div>${createdDate}</div>
          </div>
          <div class="divider"></div>
          <div>
            <div class="bold">CLIENTE:</div>
            <div>${order.client ? order.client.name : 'Balcão'}</div>
          </div>
          <div class="divider"></div>
          <div>${itemsHtml}</div>
          <div class="divider"></div>
          <div class="total-section">
            <div style="display:flex; justify-content:space-between;"><span>Pagamento:</span><span>${order.paymentMethod}</span></div>
            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:16px; margin-top:5px;">
              <span>TOTAL:</span><span>R$ ${order.total.toFixed(2)}</span>
            </div>
          </div>
          ${order.observations ? `<div class="divider"></div><div><span class="bold">OBS:</span> ${order.observations}</div>` : ''}
          <div style="text-align:center; margin-top:20px; font-size:10px;">Obrigado pela preferência!</div>
        </body>
      </html>
    `;
  }

  private getKitchenHtml(order: FullOrderForPdf): string {
    const createdDate = new Date(order.createdAt).toLocaleString('pt-BR');
    const itemsHtml = order.items.map(item => `
      <tr>
        <td>${item.product.name}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">R$ ${item.price.toFixed(2)}</td>
        <td style="text-align: right;">R$ ${(item.quantity * item.price).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: sans-serif; margin: 40px; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #1B5E20; color: white; padding: 10px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #eee; }
            .box { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div style="border-bottom: 2px solid #1B5E20; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="margin:0; color:#1B5E20;">Pedido #${order.id}</h1>
            <p>Data: ${createdDate} | Status: <strong>${order.status}</strong></p>
          </div>

          <div class="box">
            <h3>Cliente</h3>
            <p><strong>Nome:</strong> ${order.client ? order.client.name : 'Balcão'}</p>
            <p><strong>Pagamento:</strong> ${order.paymentMethod}</p>
          </div>

          <table>
            <thead>
              <tr><th width="50%">Produto</th><th width="15%" align="center">Qtd</th><th width="15%" align="right">Unit.</th><th width="20%" align="right">Total</th></tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr>
                <td colspan="3" align="right" style="font-weight:bold; font-size:18px; padding-top:15px;">TOTAL:</td>
                <td align="right" style="font-weight:bold; font-size:18px; padding-top:15px;">R$ ${order.total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          ${order.observations ? `<div class="box" style="margin-top:20px; border:2px dashed #d32f2f; background:#fff5f5;"><h3 style="margin:0; color:#d32f2f;">⚠️ Observações:</h3><p>${order.observations}</p></div>` : ''}
        </body>
      </html>
    `;
  }
}
