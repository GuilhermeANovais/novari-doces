import { Controller, Get, Delete, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { BackofficeService } from './backoffice.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('backoffice')
export class BackofficeController {
  constructor(private readonly backofficeService: BackofficeService) {}

  @Get('companies')
  @Roles('MASTER')
  findAll() {
    return this.backofficeService.listAllCompanies();
  }

  // --- NOVA ROTA: Mudar Plano ---
  @Patch('companies/:id/plan')
  @Roles('MASTER')
  changePlan(
    @Param('id') id: string, 
    @Body() body: { plan: 'FREE' | 'PRO' }
  ) {
    return this.backofficeService.togglePlan(id, body.plan);
  }

  @Delete('companies/:id')
  @Roles('MASTER')
  delete(@Param('id') id: string) {
    return this.backofficeService.deleteCompany(id);
  }
}
