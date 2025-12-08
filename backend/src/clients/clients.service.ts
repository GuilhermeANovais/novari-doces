// src/clients/clients.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  create(createClientDto: CreateClientDto) {
    return this.prisma.client.create({
      data: createClientDto,
    });
  }

  findAll() {
    return this.prisma.client.findMany({
      where: { deletedAt: null },
      orderBy: {
        name: 'asc',
      },
    });
  }

  findOne(id: number) {
    return this.prisma.client.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' }, // Pedidos mais recentes primeiro
          include: {
            items: {
              include: { product: true },
            },
          },
        },
      },
    });
  }

  update(id: number, updateClientDto: UpdateClientDto) {
    return this.prisma.client.update({
      where: { id },
      data: updateClientDto,
    });
  }

  remove(id: number) {
    return this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
