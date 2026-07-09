// Проверяет JWT токен
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { jwtConfig } from '../../config/jwt.config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Проверяем, открытый ли это эндпоинт
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true; // Пропускаем без проверки токена
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Токен не предоставлен');
    }
    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Неверный формат токена');
    }

    try {
      // Проверяем и расшифровываем токен
      const payload = jwt.verify(token, jwtConfig.secret);
      request.user = payload; // Добавляем данные пользователя в запрос
      return true;
    } catch (error) {
      throw new UnauthorizedException('Недействительный токен');
    }
  }
}