import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Kysely } from 'kysely';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Database } from '../database/database.provider';

@Injectable()
export class AuthService {
  constructor(
    @Inject('DATABASE') private readonly db: Kysely<Database>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthService.name);
  }

  // Регистрация нового пользователя
  async register(dto: RegisterDto) {
    this.logger.info(`Попытка регистрации пользователя: ${dto.username}`);
    // Проверяем, нет ли уже такого
    const existingUser = await this.db
      .selectFrom('users')
      .selectAll()
      .where('username', '=', dto.username)
      .executeTakeFirst();
    if (existingUser) {
      this.logger.warn(`Регистрация отклонена: пользователь ${dto.username} уже существует`);
      throw new ConflictException('Пользователь с таким именем уже существует');
    }
    // Хешируем пароль
    const passwordHash = await bcrypt.hash(dto.password, 10);
    // Получаем id роли warehouse
    const warehouseRole = await this.db
      .selectFrom('roles')
      .select('id')
      .where('name', '=', 'warehouse')
      .executeTakeFirst();
    // Создаём пользователя
    const result = await this.db
      .insertInto('users')
      .values({
        username: dto.username,
        password_hash: passwordHash,
        email: dto.email,
        role_id: warehouseRole!.id,
      } as any)
      .returning(['id', 'username', 'email', 'role_id'])
      .executeTakeFirst();
    this.logger.info(`Пользователь ${dto.username} успешно зарегистрирован (id: ${result!.id})`);
    return result;
  }
  // Вход в систему
  async login(dto: LoginDto) {
    this.logger.info(`Попытка входа пользователя: ${dto.username}`);
    // Ищем пользователя и его роль
    const user = await this.db
      .selectFrom('users')
      .innerJoin('roles', 'roles.id', 'users.role_id')
      .select([
        'users.id',
        'users.username',
        'users.password_hash',
        'users.email',
        'users.role_id',
        'roles.name as role_name',
      ])
      .where('users.username', '=', dto.username)
      .executeTakeFirst();

    if (!user) {
      this.logger.warn(`Вход отклонен: пользователь ${dto.username} не найден`);
      throw new UnauthorizedException('Неверное имя пользователя или пароль');
    }
    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );
    if (!isPasswordValid) {
      this.logger.warn(`Вход отклонен: неверный пароль для пользователя ${dto.username}`);
      throw new UnauthorizedException('Неверное имя пользователя или пароль');
    }
    // Создаём токен
    const token = jwt.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role_name,
        role_id: user.role_id,
      },
      jwtConfig.secret,
      { expiresIn: 86400 },
    );

    this.logger.info(`Пользователь ${dto.username} успешно вошёл в систему`);
    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role_name,
      },
    };
  }
}