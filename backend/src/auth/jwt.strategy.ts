import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET ausente');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    // O retorno deste método é injetado em @Request() req.user
    if (!payload.organizationId) {
        // Se for token antigo sem org, pode dar erro.
        // O ideal é forçar relogin ou tratar como null.
    }
    return { 
      userId: payload.sub, 
      email: payload.email, 
      role: payload.role,
      organizationId: payload.organizationId 
    };
  }
}
