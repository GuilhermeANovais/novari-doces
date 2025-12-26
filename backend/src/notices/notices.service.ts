import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNoticeDto } from './dto/create-notice.dto';

@Injectable()
export class NoticesService {
  constructor(private prisma: PrismaService) {}

  async create(createNoticeDto: CreateNoticeDto, userId: number, organizationId: number) {
    return this.prisma.notice.create({
      data: {
        ...createNoticeDto,
        userId,
        organizationId: Number(organizationId),
      },
      include: {
        user: { select: { name: true, role: true } },
      },
    });
  }

  async findAll(organizationId: number) {
    return this.prisma.notice.findMany({
      where: { organizationId: Number(organizationId) },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: { select: { name: true, role: true } },
      },
    });
  }

  async remove(id: number, organizationId: number) {
    // Garante que só apaga da própria organização
    const notice = await this.prisma.notice.findFirst({
        where: { id, organizationId: Number(organizationId) }
    });
    
    if (!notice) throw new NotFoundException("Aviso não encontrado.");

    return this.prisma.notice.delete({ where: { id } });
  }
}
