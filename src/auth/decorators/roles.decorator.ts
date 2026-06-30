// Декоратор для указания ролей, которым разрешён доступ
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);