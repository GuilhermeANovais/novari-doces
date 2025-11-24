import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  create(createExpenseDto: CreateExpenseDto, userId: number) {
    return this.prisma.expense.create({
      data: {
        ...createExpenseDto,
        userId,
      },
    });
  }

  findAll() {
    return this.prisma.expense.findMany({
      orderBy: { date: 'desc' },
      include: { user: { select: { name: true } } }
    });
  }

  remove(id: number) {
    return this.prisma.expense.delete({ where: { id } });
  }
}
