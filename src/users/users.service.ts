// src/users/users.service.ts
// Бизнес-логика управления пользователями
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Database } from '../database/database.provider';

@Injectable()
export class UsersService {
  constructor(@Inject('DATABASE') private readonly db: Kysely<Database>) {}

  // Получить всех пользователей (с названиями ролей)
  async findAll() {
    return this.db
      .selectFrom('users')
      .innerJoin('roles', 'roles.id', 'users.role_id')
      .select([
        'users.id',
        'users.username',
        'users.email',
        'users.role_id',
        'roles.name as role',
        'users.created_at',
        'users.updated_at',
      ])
      .execute();
  }

  // Получить пользователя по ID
  async findById(id: number) {
    const user = await this.db
      .selectFrom('users')
      .innerJoin('roles', 'roles.id', 'users.role_id')
      .select([
        'users.id',
        'users.username',
        'users.email',
        'users.role_id',
        'roles.name as role',
        'users.created_at',
        'users.updated_at',
      ])
      .where('users.id', '=', id)
      .executeTakeFirst();

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  // Создать нового пользователя
  async create(dto: CreateUserDto) {
    // Проверяем уникальность username
    const existingUser = await this.db
      .selectFrom('users')
      .selectAll()
      .where('username', '=', dto.username)
      .executeTakeFirst();

    if (existingUser) {
      throw new ConflictException(
        'Пользователь с таким именем уже существует',
      );
    }

    // Находим роль по названию
    const role = await this.db
      .selectFrom('roles')
      .select('id')
      .where('name', '=', dto.role)
      .executeTakeFirst();

    if (!role) {
      throw new NotFoundException(`Роль "${dto.role}" не найдена`);
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Создаём пользователя
    const result = await this.db
      .insertInto('users')
      .values({
        username: dto.username,
        password_hash: passwordHash,
        email: dto.email,
        role_id: role.id,
      } as any) // as any чтобы обойти строгую типизацию для id, created_at, updated_at
      .returning(['id', 'username', 'email', 'role_id'])
      .executeTakeFirst();

    return { ...result, role: dto.role };
  }

  // Обновить пользователя
  async update(id: number, dto: UpdateUserDto) {
    // Проверяем, существует ли пользователь
    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Готовим данные для обновления
    const updateData: any = { updated_at: new Date() };

    if (dto.username) updateData.username = dto.username;
    if (dto.email) updateData.email = dto.email;
    if (dto.password) {
      updateData.password_hash = await bcrypt.hash(dto.password, 10);
    }
    if (dto.role) {
      const role = await this.db
        .selectFrom('roles')
        .select('id')
        .where('name', '=', dto.role)
        .executeTakeFirst();

      if (!role) {
        throw new NotFoundException(`Роль "${dto.role}" не найдена`);
      }
      updateData.role_id = role.id;
    }

    // Обновляем пользователя
    const result = await this.db
      .updateTable('users')
      .set(updateData)
      .where('id', '=', id)
      .returning(['id', 'username', 'email', 'role_id'])
      .executeTakeFirst();

    return result;
  }

  // Удалить пользователя
  async remove(id: number) {
    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    await this.db.deleteFrom('users').where('id', '=', id).execute();

    return { message: 'Пользователь удалён' };
  }
}