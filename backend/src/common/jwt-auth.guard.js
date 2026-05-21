import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator.js';
import { verifyToken } from './jwt.utils.js';

@Injectable()
export class JwtAuthGuard {
  constructor(@Inject(Reflector) reflector) {
    this.reflector = reflector;
  }

  canActivate(context) {
    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (authHeader?.startsWith('Bearer ')) {
      try {
        request.user = verifyToken(authHeader.slice(7));
      } catch {
        if (!isPublic) throw new UnauthorizedException('Недействительный токен');
      }
      return true;
    }

    if (isPublic) return true;
    throw new UnauthorizedException('Необходима авторизация');
  }
}
