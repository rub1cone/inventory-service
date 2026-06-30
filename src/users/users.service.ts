// Бизнес-логика управления пользователями
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@Inject('DATABASE') private readonly db: Kysely<any>) {}

  // Получить всех пользователей (без паролей!)
  async findAll() {
    return this.db
      .selectFrom('users')
      .select(['id', 'username', 'email', 'role', 'created_at', 'updated_at'])
      .execute();
  }

  // Получить пользователя по ID
  async findById(id: number) {
    const user = await this.db
      .selectFrom('users')
      .select(['id', 'username', 'email', 'role', 'created_at', 'updated_at'])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  // Создать нового пользователя (только админ)
  async create(dto: CreateUserDto) {
    // Проверяем, нет ли уже такого пользователя
    const existingUser = await this.db
      .selectFrom('users')
      .selectAll()
      .where('username', '=', dto.username)
      .executeTakeFirst();

    if (existingUser) {
      throw new ConflictException('Пользователь с таким именем уже существует');
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
        role: dto.role,
      })
      .returning(['id', 'username', 'email', 'role'])
      .executeTakeFirst();

    return result;
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
    const updateData: any = {};
    
    if (dto.username) updateData.username = dto.username;
    if (dto.email) updateData.email = dto.email;
    if (dto.role) updateData.role = dto.role;
    if (dto.password) {
      updateData.password_hash = await bcrypt.hash(dto.password, 10);
    }
    
    updateData.updated_at = new Date();

    // Обновляем пользователя
    const result = await this.db
      .updateTable('users')
      .set(updateData)
      .where('id', '=', id)
      .returning(['id', 'username', 'email', 'role'])
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

    await this.db
      .deleteFrom('users')
      .where('id', '=', id)
      .execute();

    return { message: 'Пользователь удалён' };
  }
}