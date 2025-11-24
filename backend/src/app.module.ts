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

@Module({
  imports: [
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
  ],
  controllers: [AppController],
  providers: [AppService, PdfService],
})
export class AppModule {}
