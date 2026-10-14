import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator.js';
import { verifyToken } from './jwt.utils.js';

@Injectable()
export class AdminGuard {
  constructor(@Inject(Reflector) reflector) {
    this.reflector = reflector;
  }

  canActivate(context) {
    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) throw new ForbiddenException('Admin token required');

    try {
      const payload = verifyToken(authHeader.slice(7));
      if (payload.role !== 'admin') throw new Error();
      return true;
    } catch {
      throw new ForbiddenException('Invalid admin token');
    }
  }
}
