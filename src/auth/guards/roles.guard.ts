import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Получаем список ролей из декоратора @Roles()
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    // Если роли не указаны — пропускаем 
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    // Получаем пользователя из запроса (его добавил JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Пользователь не авторизован');
    }
    // Проверяем роль
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `У вас недостаточно прав. Требуется роль: ${requiredRoles.join(' или ')}`,
      );
    }
    return true;
  }
}