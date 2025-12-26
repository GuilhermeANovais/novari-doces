import { 
  Controller, Get, Post, Body, Patch, Param, Delete, 
  UseGuards, Request, ParseIntPipe 
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(@Body() createExpenseDto: CreateExpenseDto, @Request() req: any) {
    return this.expensesService.create(createExpenseDto, req.user.userId, req.user.organizationId);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.expensesService.findAll(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.expensesService.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Request() req: any
  ) {
    return this.expensesService.update(id, updateExpenseDto, req.user.organizationId);
  }

  @Delete('delete-all')
  removeAll(@Request() req: any) {
    return this.expensesService.removeAll(req.user.userId, req.user.organizationId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.expensesService.remove(id, req.user.organizationId);
  }
}
