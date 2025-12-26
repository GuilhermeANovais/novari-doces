import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(createExpenseDto: CreateExpenseDto, userId: number, organizationId: number) {
    return this.prisma.expense.create({
      data: {
        description: createExpenseDto.description,
        amount: createExpenseDto.amount,
        category: createExpenseDto.category,
        date: createExpenseDto.date ? new Date(createExpenseDto.date) : new Date(),
        userId: userId,
        organizationId: Number(organizationId), // Conversão explícita
      },
    });
  }

  findAll(organizationId: number) {
    return this.prisma.expense.findMany({
      where: { 
        organizationId: Number(organizationId),
        deletedAt: null 
      },
      orderBy: { date: 'desc' },
      include: {
        user: { select: { name: true } },
      },
    });
  }

  async findOne(id: number, organizationId: number) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, organizationId: Number(organizationId) },
    });
    if (!expense) throw new NotFoundException('Despesa não encontrada.');
    return expense;
  }

  async update(id: number, updateExpenseDto: UpdateExpenseDto, organizationId: number) {
    await this.findOne(id, organizationId); // Garante permissão

    return this.prisma.expense.update({
      where: { id },
      data: {
        description: updateExpenseDto.description,
        amount: updateExpenseDto.amount,
        category: updateExpenseDto.category,
        date: updateExpenseDto.date ? new Date(updateExpenseDto.date) : undefined,
      },
    });
  }

  async remove(id: number, organizationId: number) {
    await this.findOne(id, organizationId);

    return this.prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async removeAll(userId: number, organizationId: number) {
    const count = await this.prisma.expense.deleteMany({
      where: { organizationId: Number(organizationId) }
    });
    return { message: `Foram removidas ${count.count} despesas.` };
  }
}
