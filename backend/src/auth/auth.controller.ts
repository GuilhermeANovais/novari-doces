// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    const user = await this.authService.register(registerUserDto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user; 
    return result;
  }

  @UseGuards(AuthGuard('local')) // Usa o porteiro (LocalStrategy)
  @Post('login')
  async login(@Request() req: any) {
    // Se a LocalStrategy passou, o 'req.user' contém o usuário validado
    return this.authService.login(req.user);
  }
}