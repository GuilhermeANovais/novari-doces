import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- CORREÇÃO DE CORS ---
  // Permite qualquer origem (útil para desenvolvimento com IPs dinâmicos)
  app.enableCors({
    origin: true, // Aceita qualquer origem
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Ouve em todos os endereços de rede (0.0.0.0)
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0'); 
  
  console.log(`🚀 Servidor a correr na porta: ${port}`);
}
bootstrap();