import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const { name, email, password, role, adminSecret } = registerUserDto;

    // 1. Verifica se e-mail já existe
    const userExists = await this.prisma.user.findUnique({ where: { email } });
    if (userExists) {
      throw new BadRequestException('E-mail já está em uso.');
    }

    // 2. Validação de Segurança para ADMIN
    // Se o utilizador tentar criar um Admin, exigimos a senha mestra
    if (role === 'ADMIN') {
      const secret = process.env.ADMIN_SECRET;
      
      // Se não houver senha configurada no .env, bloqueia por segurança ou define um padrão (não recomendado para prod)
      if (!secret) {
         throw new UnauthorizedException('Configuração de servidor incompleta (ADMIN_SECRET ausente).');
      }

      if (adminSecret !== secret) {
        throw new UnauthorizedException('Chave de Administrador incorreta.');
      }
    }

    // 3. Criptografa a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Cria o utilizador com o cargo definido
    // O "as Role" garante ao TypeScript que a string bate com o Enum do Prisma
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as Role, 
      },
    });

    // Retorna os dados (sem a senha)
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    // Incluímos a 'role' no payload do token para o frontend saber o que mostrar
    const payload = { email: user.email, sub: user.id, role: user.role };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }
}