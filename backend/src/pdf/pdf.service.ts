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

  // --- MÉTODO 1: Para Pedidos (Usado pelo Controller) ---
  async generatePdf(orderId: number, type: 'receipt' | 'kitchen'): Promise<{ buffer: Uint8Array; filename: string }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        items: { include: { product: true } },
      },
    });

    if (!order) throw new NotFoundException('Pedido não encontrado');

    // 1. Gera o HTML baseado no tipo
    const html = type === 'receipt' 
      ? this.getReceiptHtml(order) 
      : this.getKitchenHtml(order);

    // 2. Define opções de impressão baseadas no tipo
    let pdfOptions: any;
    if (type === 'receipt') {
      pdfOptions = {
        width: '80mm',
        printBackground: true,
        margin: { top: '5mm', right: '2mm', bottom: '5mm', left: '2mm' },
      };
    } else {
      pdfOptions = {
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      };
    }

    // 3. Usa o método genérico para criar o PDF
    const buffer = await this.generatePdfFromHtml(html, pdfOptions);

    // 4. Nome do arquivo
    const date = new Date(order.createdAt);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const prefix = type === 'receipt' ? 'cupom' : 'pedido_completo';
    const filename = `${prefix}_#${order.id}_${dateStr}.pdf`;

    return { buffer, filename };
  }

  // --- MÉTODO 2: Genérico (Usado pelo TasksService e internamente) ---
  // Restaura este método para corrigir o erro no TasksService
  async generatePdfFromHtml(html: string, options: any = {}): Promise<Uint8Array> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Se não passarem opções (caso do TasksService), usa A4 por padrão
    const finalOptions = Object.keys(options).length > 0 ? options : {
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    };

    const pdfBuffer = await page.pdf(finalOptions);

    await browser.close();
    return pdfBuffer;
  }

  // --- Helpers de HTML (Privados) ---

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
            .brand { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .item-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .item-name { flex: 1; margin-right: 10px; }
            .total-section { margin-top: 10px; font-size: 14px; }
            .footer { margin-top: 20px; text-align: center; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header text-center">
            <div class="brand">CONFEITARIA HEAVEN</div>
            <div>Pedido #${order.id}</div>
            <div>${createdDate}</div>
          </div>
          <div class="divider"></div>
          <div class="client-info">
            <div class="bold">CLIENTE:</div>
            <div>${order.client ? order.client.name : 'Consumidor Final'}</div>
            ${order.client?.phone ? `<div>Tel: ${order.client.phone}</div>` : ''}
            ${order.client?.address ? `<div>End: ${order.client.address}</div>` : ''}
          </div>
          ${order.deliveryDate ? `<div style="margin-top: 5px;"><span class="bold">ENTREGA:</span> ${new Date(order.deliveryDate).toLocaleString('pt-BR')}</div>` : ''}
          <div class="divider"></div>
          <div class="items-container">${itemsHtml}</div>
          <div class="divider"></div>
          <div class="total-section">
            <div class="info-row"><span>Forma Pagto:</span><span>${order.paymentMethod || '—'}</span></div>
            <div class="info-row bold" style="font-size: 16px; margin-top: 5px;"><span>TOTAL:</span><span>R$ ${order.total.toFixed(2)}</span></div>
          </div>
          ${order.observations ? `<div class="divider"></div><div style="font-size: 11px;"><span class="bold">OBS:</span> ${order.observations}</div>` : ''}
          <div class="footer">Obrigado pela preferência!</div>
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
            body { font-family: 'Helvetica', 'Arial', sans-serif; margin: 0; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1B5E20; padding-bottom: 20px; margin-bottom: 30px; }
            .brand h1 { margin: 0; color: #1B5E20; font-size: 28px; }
            .order-details { text-align: right; }
            .box { background: #f9f9f9; border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .box h3 { margin-top: 0; color: #1B5E20; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #1B5E20; color: white; padding: 10px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #eee; }
            .total-row td { border-top: 2px solid #333; font-weight: bold; font-size: 18px; color: #1B5E20; }
            .obs-box { border: 2px dashed #d32f2f; background: #fff5f5; padding: 15px; margin-top: 20px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">
              <h1>Confeitaria Heaven</h1>
              <p>Relatório de Produção / Entrega</p>
            </div>
            <div class="order-details">
              <h2>Pedido #${order.id}</h2>
              <p>Data: ${createdDate}</p>
              <p>Status: <strong>${order.status}</strong></p>
            </div>
          </div>

          <div style="display: flex; gap: 20px;">
            <div class="box" style="flex: 1;">
              <h3>Dados do Cliente</h3>
              <p><strong>Nome:</strong> ${order.client ? order.client.name : 'Consumidor Final'}</p>
              <p><strong>Telefone:</strong> ${order.client?.phone || '—'}</p>
              <p><strong>Endereço:</strong> ${order.client?.address || '—'}</p>
            </div>
            <div class="box" style="flex: 1;">
              <h3>Logística</h3>
              <p><strong>Data Entrega:</strong> ${order.deliveryDate ? new Date(order.deliveryDate).toLocaleString('pt-BR') : 'Imediata'}</p>
              <p><strong>Pagamento:</strong> ${order.paymentMethod}</p>
            </div>
          </div>

          <h3>Itens do Pedido</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 50%">Produto</th>
                <th style="width: 15%; text-align: center;">Qtd</th>
                <th style="width: 15%; text-align: right;">Unit.</th>
                <th style="width: 20%; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr class="total-row">
                <td colspan="3" style="text-align: right;">TOTAL A PAGAR:</td>
                <td style="text-align: right;">R$ ${order.total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          ${order.observations ? `
            <div class="obs-box">
              <h3 style="margin-top: 0; color: #d32f2f;">⚠️ Observações:</h3>
              <p style="font-size: 16px;">${order.observations}</p>
            </div>
          ` : ''}

          <div class="footer">
            Documento gerado internamente pelo sistema Heaven Dashboard.
          </div>
        </body>
      </html>
    `;
  }
}