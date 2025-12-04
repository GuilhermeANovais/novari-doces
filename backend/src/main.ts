import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Permite conexões de qualquer origem (Tablet, Celular, PC)
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const config = new DocumentBuilder()
    .setTitle('Confeitaria Heaven')
    .setDescription('API para gestão de doceria')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

  // 2. O '0.0.0.0' é OBRIGATÓRIO para acesso via IP/Wi-Fi
  await app.listen(3000, '0.0.0.0');
  console.log(`🚀 Servidor rodando e aceitando conexões na porta 3000`);
}
bootstrap();
