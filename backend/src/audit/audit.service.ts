// src/audit/audit.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  // Usado para criar logs
  async createLog(userId: number, action: string, entity: string, entityId: number, details?: string) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details,
      },
    });
  }

  // Usado para listar logs no frontend
  async findAll() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' }, // Mais recentes primeiro
      include: {
        user: {
          select: { name: true, email: true }, // Mostra quem fez
        },
      },
    });
  }
}