import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards, 
  Request, 
  ParseIntPipe, 
  Res // <--- Adicionado Res
} from '@nestjs/common'; // <--- Removido Response daqui
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import type { Response } from 'express'; // <--- Mantido Response daqui (Tipagem)

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.reportsService.findAll(req.user.organizationId);
  }
  
  // Rota para baixar PDF
  @Get(':id/download')
  async downloadReport(
    @Param('id', ParseIntPipe) id: number, 
    @Request() req: any, 
    @Res() res: Response // <--- Agora Res existe e Response é do Express
  ) {
    const report = await this.reportsService.findOne(id, req.user.organizationId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Relatorio-${report.month}-${report.year}.pdf"`);
    res.send(report.pdfData);
  }

  @Post('generate')
  createManual(@Body() body: { month: number; year: number }, @Request() req: any) {
    return this.reportsService.createManualReport(body.month, body.year, req.user.organizationId);
  }
}
