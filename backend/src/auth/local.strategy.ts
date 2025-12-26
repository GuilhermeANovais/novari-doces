import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, pass: string): Promise<any> {
    // Se o TS reclamar aqui, verifique se auth.service.ts está salvo e sem erros
    const user = await this.authService.validateUser(email, pass);
    if (!user) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }
    return user;
  }
}
