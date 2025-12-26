import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

export enum UserRole {
  ADMIN = 'ADMIN',
  COZINHA = 'COZINHA',
  DELIVERY = 'DELIVERY',
}

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
  password: string;

  // NOVO: Senha extra para Admin (Opcional, pois só Admin usa)
  @IsOptional()
  @IsString()
  adminSecret?: string;

  @IsString({ message: 'O nome da empresa deve ser uma string' })
  @IsNotEmpty({ message: 'O nome da empresa é obrigatório' })
  companyName: string;
}
