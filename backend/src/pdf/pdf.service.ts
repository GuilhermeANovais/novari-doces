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

  async generateOrderHtml(orderId: number): Promise<{ html: string; order: FullOrderForPdf }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        items: { include: { product: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    const createdDate = new Date(order.createdAt).toLocaleString('pt-BR');
    
    // Formata itens para o HTML
    const itemsHtml = order.items.map(item => `
      <div class="item-row">
        <div class="item-name">${item.quantity}x ${item.product.name}</div>
        <div class="item-price">R$ ${(item.quantity * item.price).toFixed(2)}</div>
      </div>
    `).join('');

    // Template Estilo "Cupom Fiscal" (80mm)
    const html = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            /* Reset e Configurações Gerais */
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; /* Fonte monoespaçada fica melhor em impressoras térmicas */
              font-size: 12px; 
              color: #000;
              width: 100%;
              padding: 5px;
            }
            
            /* Utilitários */
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            
            /* Secções */
            .header { margin-bottom: 10px; }
            .brand { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
            
            .info-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            
            /* Lista de Itens */
            .items-container { margin: 10px 0; }
            .item-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .item-name { flex: 1; margin-right: 10px; }
            .item-price { white-space: nowrap; }
            
            /* Totais */
            .total-section { margin-top: 10px; font-size: 14px; }
            
            /* Rodapé */
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

          ${order.deliveryDate ? `
            <div style="margin-top: 5px;">
              <span class="bold">ENTREGA:</span> ${new Date(order.deliveryDate).toLocaleString('pt-BR')}
            </div>
          ` : ''}

          <div class="divider"></div>

          <div class="items-container">
            ${itemsHtml}
          </div>

          <div class="divider"></div>

          <div class="total-section">
            <div class="info-row">
              <span>Forma Pagto:</span>
              <span>${order.paymentMethod || '—'}</span>
            </div>
            <div class="info-row bold" style="font-size: 16px; margin-top: 5px;">
              <span>TOTAL:</span>
              <span>R$ ${order.total.toFixed(2)}</span>
            </div>
          </div>

          ${order.observations ? `
            <div class="divider"></div>
            <div style="font-size: 11px;">
              <span class="bold">OBS:</span> ${order.observations}
            </div>
          ` : ''}

          <div class="footer">
            Obrigado pela preferência!
            <br/>
            www.confeitariaheaven.com.br
          </div>
        </body>
      </html>
    `;

    return { html, order };
  }

  async generatePdfFromHtml(html: string): Promise<Uint8Array> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Configuração para Impressora Térmica (80mm)
    const pdfBuffer = await page.pdf({
      width: '80mm', // Largura do papel
      // Altura indefinida ou grande para simular rolo contínuo. 
      // Se a impressora cortar errado, tenta fixar uma height (ex: '297mm') ou deixar auto.
      printBackground: true,
      margin: {
        top: '5mm',
        right: '2mm',
        bottom: '5mm',
        left: '2mm', // Margens pequenas para aproveitar o papel
      },
    });

    await browser.close();
    return pdfBuffer;
  }
}