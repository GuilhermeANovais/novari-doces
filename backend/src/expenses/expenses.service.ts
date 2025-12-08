import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(createExpenseDto: CreateExpenseDto, userId: number) {
    // Corrigindo o erro TS2322: Passamos os campos explicitamente
    return this.prisma.expense.create({
      data: {
        description: createExpenseDto.description,
        amount: createExpenseDto.amount,
        category: createExpenseDto.category,
        // Se a data vier, converte para Date, senão usa agora
        date: createExpenseDto.date ? new Date(createExpenseDto.date) : new Date(),
        userId: userId, // Vincula ao usuário
      },
    });
  }

  findAll() {
    return this.prisma.expense.findMany({
      where: { deletedAt: null },
      orderBy: { date: 'desc' },
      include: {
        user: { select: { name: true } },
      },
    });
  }

  // Método que estava faltando
  findOne(id: number) {
    return this.prisma.expense.findUnique({
      where: { id },
    });
  }

  // Método que estava faltando
  update(id: number, updateExpenseDto: UpdateExpenseDto) {
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

  remove(id: number) {
    return this.prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async removeAll(userId: number) {
    const count = await this.prisma.expense.deleteMany({});
    // Se tiver AuditService, adicione o log aqui
    return { message: `Foram removidas ${count.count} despesas.` };
  }
}
