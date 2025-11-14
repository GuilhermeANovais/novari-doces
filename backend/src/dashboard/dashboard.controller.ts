import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'; // 1. Importe o nosso "Guarda"

@UseGuards(JwtAuthGuard) // 2. Proteja todas as rotas deste controlador
@Controller('dashboard') // O prefixo da rota será /dashboard
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats') // O endpoint completo será GET /dashboard/stats
  getStats() {
    return this.dashboardService.getStats();
  }
}
