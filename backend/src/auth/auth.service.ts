import {
  Injectable,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // 1. VALIDAR UTILIZADOR (Usado pelo LocalStrategy)
  // Verifica se o email e senha batem. Retorna o user sem a senha.
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  // 2. LOGIN (Gera o Token)
  // Recebe o utilizador já validado pelo LocalStrategy
  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }

  // 3. REGISTO (Cria Empresa + Admin)
  async register(registerUserDto: RegisterUserDto) {
    const { email, password, name, companyName } = registerUserDto;

    // Verifica email
    const userExists = await this.prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      throw new ConflictException('Este email já está em uso.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Transação: Organização + User
    const result = await this.prisma.$transaction(async (prisma) => {
      const organization = await prisma.organization.create({
        data: {
          name: companyName,
        },
      });

      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'ADMIN',
          organizationId: organization.id,
        },
      });

      return user;
    });

    return {
      message: 'Empresa e utilizador registados com sucesso!',
      userId: result.id,
    };
  }
}
