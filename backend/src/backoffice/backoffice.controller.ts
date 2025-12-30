import { Controller, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { BackofficeService } from './backoffice.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard) // <--- Aplica os dois guardas
@Controller('backoffice')
export class BackofficeController {
  constructor(private readonly backofficeService: BackofficeService) {}

  @Get('companies')
  @Roles('MASTER') // <--- Apenas MASTER entra aqui
  findAll() {
    return this.backofficeService.listAllCompanies();
  }

  @Delete('companies/:id')
  @Roles('MASTER')
  delete(@Param('id') id: string) {
    return this.backofficeService.deleteCompany(id);
  }
}
