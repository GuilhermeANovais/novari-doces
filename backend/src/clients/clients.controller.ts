import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Body() createClientDto: CreateClientDto, @Request() req: any) {
    return this.clientsService.create(createClientDto, req.user.organizationId);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.clientsService.findAll(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.clientsService.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateClientDto: UpdateClientDto, @Request() req: any) {
    return this.clientsService.update(id, updateClientDto, req.user.organizationId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.clientsService.remove(id, req.user.organizationId);
  }
}
