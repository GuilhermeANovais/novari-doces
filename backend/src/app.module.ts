import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { OrdersModule } from './orders/orders.module';
import { ClientsModule } from './clients/clients.module';
import { PdfService } from './pdf/pdf.service';
import { AuditModule } from './audit/audit.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './tasks/tasks.service';
import { ReportsModule } from './reports/reports.module';
import { SearchModule } from './search/search.module';
import { NoticesModule } from './notices/notices.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    PrismaModule,
    ProductsModule,
    UsersModule,
    AuthModule,
    DashboardModule,
    OrdersModule,
    ClientsModule,
    AuditModule,
    ExpensesModule,
    ReportsModule,
    SearchModule,
    NoticesModule,
  ],
  controllers: [AppController],
  providers: [AppService, PdfService, TasksService],
})
export class AppModule {}
