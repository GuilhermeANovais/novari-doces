// src/audit/audit.module.ts
import { Module, Global } from '@nestjs/common'; // Importe Global
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';

@Global() // Torne Global para facilitar o uso em todo o app
@Module({
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService], // <<< EXPORTE AQUI
})
export class AuditModule {}