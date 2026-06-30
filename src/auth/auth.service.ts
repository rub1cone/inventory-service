// Бизнес-логика авторизации
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(@Inject('DATABASE') private readonly db: Kysely<any>) {}

  // Регистрация нового пользователя
  async register(dto: RegisterDto) {
    // Проверяем, нет ли уже такого пользователя
    const existingUser = await this.db
      .selectFrom('users')
      .selectAll()
      .where('username', '=', dto.username)
      .executeTakeFirst();

    if (existingUser) {
      throw new ConflictException('Пользователь с таким именем уже существует');
    }

    // Хешируем пароль (10 - количество раундов соли)
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Создаём пользователя (по умолчанию роль 'warehouse')
    const result = await this.db
      .insertInto('users')
      .values({
        username: dto.username,
        password_hash: passwordHash,
        email: dto.email,
        role: 'warehouse', // обычный пользователь склада по умолчанию
      })
      .returning(['id', 'username', 'email', 'role'])
      .executeTakeFirst();

    return result;
  }

  // Вход в систему
  async login(dto: LoginDto) {
    // Ищем пользователя по имени
    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('username', '=', dto.username)
      .executeTakeFirst();

    if (!user) {
      throw new UnauthorizedException('Неверное имя пользователя или пароль');
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверное имя пользователя или пароль');
    }

    // Создаём JWT токен
    const token = jwt.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }
}