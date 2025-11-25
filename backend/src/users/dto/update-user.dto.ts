// src/users/dto/update-user.dto.ts
import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
  password?: string;
}
