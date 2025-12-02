import { Controller, Get, Post, Body, UseGuards, Res, Param, ParseIntPipe } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import type { Response } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  findAll() {
    return this.reportsService.findAll();
  }

  // --- NOVA ROTA: GERAR RELATÓRIO ---
  @Post('generate')
  async generateReport(@Body() body: { month: number; year: number }) {
    return this.reportsService.createManualReport(body.month, body.year);
  }

  // Rota para baixar o PDF (já deve existir, mas reforço aqui)
  @Get(':id/download')
  async downloadPdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    // Nota: Terás de adicionar o método findOne no service se não tiveres
    // Mas para simplificar, o findAll já devolve os dados, se o frontend já tiver o PDF em base64/buffer
    // Se precisares baixar, o ideal é o service buscar pelo ID e devolver o buffer.
    // Vou pular esta parte para focar na GERAÇÃO que é o problema atual.
  }
}