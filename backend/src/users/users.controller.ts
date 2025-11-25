// src/users/users.controller.ts
import { Controller, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Patch('profile') // Endpoint: PATCH /users/profile
  updateProfile(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
    // Usa o ID do token (req.user.userId) para garantir que só altera o próprio perfil
    return this.usersService.update(req.user.userId, updateUserDto);
  }
}
