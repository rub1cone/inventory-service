import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Kysely } from 'kysely';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Database } from '../database/database.provider';

@Injectable()
export class UsersService {
  constructor(
    @Inject('DATABASE') private readonly db: Kysely<Database>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UsersService.name);
  }

  async findAll() {
    this.logger.info('Запрос списка всех пользователей');
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

  async findById(id: number) {
    this.logger.info(`Запрос пользователя id=${id}`);
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

  async create(dto: CreateUserDto) {
    this.logger.info(`Создание пользователя: ${dto.username}, роль: ${dto.role}`);

    const existingUser = await this.db
      .selectFrom('users')
      .selectAll()
      .where('username', '=', dto.username)
      .executeTakeFirst();

    if (existingUser) {
      this.logger.warn(`Создание отклонено: пользователь ${dto.username} уже существует`);
      throw new ConflictException('Пользователь с таким именем уже существует');
    }

    const role = await this.db
      .selectFrom('roles')
      .select('id')
      .where('name', '=', dto.role)
      .executeTakeFirst();

    if (!role) {
      throw new NotFoundException(`Роль "${dto.role}" не найдена`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const result = await this.db
      .insertInto('users')
      .values({
        username: dto.username,
        password_hash: passwordHash,
        email: dto.email,
        role_id: role.id,
      } as any)
      .returning(['id', 'username', 'email', 'role_id'])
      .executeTakeFirst();
    this.logger.info(`Пользователь ${dto.username} создан (id: ${result!.id})`);
    return { ...result, role: dto.role };
  }

  async update(id: number, dto: UpdateUserDto) {
    this.logger.info(`Обновление пользователя id=${id}`);

    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
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
      if (!role) throw new NotFoundException(`Роль "${dto.role}" не найдена`);
      updateData.role_id = role.id;
    }

    const result = await this.db
      .updateTable('users')
      .set(updateData)
      .where('id', '=', id)
      .returning(['id', 'username', 'email', 'role_id'])
      .executeTakeFirst();

    this.logger.info(`Пользователь id=${id} обновлён`);
    return result;
  }

  async remove(id: number) {
    this.logger.info(`Удаление пользователя id=${id}`);

    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    await this.db.deleteFrom('users').where('id', '=', id).execute();
    this.logger.info(`Пользователь ${user.username} удалён`);
    return { message: 'Пользователь удалён' };
  }
}