import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PdfService } from 'src/pdf/pdf.service';


@Module({
  imports: [PrismaModule],
  controllers: [ReportsController],
  providers: [ReportsService, PdfService],
})
export class ReportsModule {}
