import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  create(createClientDto: CreateClientDto, organizationId: number) {
    return this.prisma.client.create({
      data: {
        ...createClientDto,
        organizationId: Number(organizationId),
      },
    });
  }

  findAll(organizationId: number) {
    return this.prisma.client.findMany({
      where: { 
        organizationId: Number(organizationId),
        deletedAt: null 
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number, organizationId: number) {
    const client = await this.prisma.client.findFirst({
      where: { 
        id, 
        organizationId: Number(organizationId) 
      },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          include: { items: { include: { product: true } } },
        },
      },
    });

    if (!client) throw new NotFoundException('Cliente não encontrado.');
    return client;
  }

  async update(id: number, updateClientDto: UpdateClientDto, organizationId: number) {
    // Verifica existência antes
    await this.findOne(id, organizationId);

    return this.prisma.client.update({
      where: { id },
      data: updateClientDto,
    });
  }

  async remove(id: number, organizationId: number) {
    await this.findOne(id, organizationId);
    
    return this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
