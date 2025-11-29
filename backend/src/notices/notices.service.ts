import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNoticeDto } from './dto/create-notice.dto';

@Injectable()
export class NoticesService {
  constructor(private prisma: PrismaService) {}

  async create(createNoticeDto: CreateNoticeDto, userId: number) {
    return this.prisma.notice.create({
      data: {
        ...createNoticeDto,
        userId,
      },
      include: {
        user: { select: { name: true, role: true } }, // Retorna logo o nome para o frontend
      },
    });
  }

  async findAll() {
    return this.prisma.notice.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20, // Mostra apenas os últimos 20 avisos
      include: {
        user: { select: { name: true, role: true } },
      },
    });
  }

  async remove(id: number) {
    // Aqui poderíamos adicionar lógica para só o autor ou Admin apagar
    // Por simplicidade, deixamos aberto para quem tiver acesso à rota
    return this.prisma.notice.delete({ where: { id } });
  }
}
