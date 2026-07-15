import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PinoLogger } from 'nestjs-pino';

describe('AuthService', () => {
  let service: AuthService;
  let mockDb: any;
  let mockLogger: any;

  beforeEach(async () => {
    // Создаём заглушку
    mockDb = {
      selectFrom: jest.fn().mockReturnThis(),
      insertInto: jest.fn().mockReturnThis(),
      selectAll: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      executeTakeFirst: jest.fn(),
      execute: jest.fn(),
      innerJoin: jest.fn().mockReturnThis(),
    };

    // Создаём мок для логгера
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setContext: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'DATABASE', useValue: mockDb },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });
  it('должен быть определён', () => {
    expect(service).toBeDefined();
  });
  describe('register', () => {
    it('должен выбросить ошибку, если пользователь уже существует', async () => {
      // Настраиваем мок: пользователь найден
      mockDb.executeTakeFirst.mockResolvedValueOnce({
        id: 1,
        username: 'existing_user',
      });
      await expect(
        service.register({
          username: 'existing_user',
          password: 'pass123',
          email: 'test@test.com',
        }),
      ).rejects.toThrow('Пользователь с таким именем уже существует');
    });
    it('должен успешно создать пользователя', async () => {
      // Первый вызов: проверка существующего пользователя (нет)
      mockDb.executeTakeFirst.mockResolvedValueOnce(null);
      // Второй: поиск роли warehouse
      mockDb.executeTakeFirst.mockResolvedValueOnce({ id: 2 });
      // Третий: создание пользователя
      mockDb.executeTakeFirst.mockResolvedValueOnce({
        id: 5,
        username: 'new_user',
        email: 'new@test.com',
        role_id: 2,
      });

      const result = await service.register({
        username: 'new_user',
        password: 'pass123',
        email: 'new@test.com',
      });

      expect(result).toHaveProperty('username', 'new_user');
      expect(result).toHaveProperty('email', 'new@test.com');
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('должен выбросить ошибку, если пользователь не найден', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(null);

      await expect(
        service.login({ username: 'unknown', password: 'pass' }),
      ).rejects.toThrow('Неверное имя пользователя или пароль');
    });
  });
});