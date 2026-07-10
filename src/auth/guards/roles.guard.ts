// Проверяет, что у пользователя нужная роль
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    // Получаем список ролей из декоратора @Roles()
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    // Если роли не указаны в декораторе - пропускаем (доступ открыт)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    // Получаем пользователя из запроса (его добавил JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    // Потом доделаю (ШТУКА НЕ РАБОТАЕТ ДЛЯ СКЛАДА)
    console.log('RolesGuard вызван!');
    console.log('requiredRoles:', requiredRoles);
    console.log('user:', user);
    if (!user) {
      throw new ForbiddenException('Пользователь не авторизован');
    }

    // Проверяем, есть ли у пользователя нужная роль
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException('У вас недостаточно прав для этого действия');
    }
    return true;
  }
}