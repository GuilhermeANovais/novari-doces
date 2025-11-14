// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Usa a variável do .env
      signOptions: { expiresIn: '1d' }, 
    }),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy // Adiciona a estratégia Local
    // Aqui seria adicionada a JwtStrategy
  ], 
  controllers: [AuthController],
})
export class AuthModule {}