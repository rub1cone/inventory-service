import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PinoLogger } from 'nestjs-pino';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let mockDb: any;
  let mockLogger: any;

  beforeEach(async () => {
    mockDb = {
      selectFrom: jest.fn().mockReturnThis(),
      insertInto: jest.fn().mockReturnThis(),
      updateTable: jest.fn().mockReturnThis(),
      deleteFrom: jest.fn().mockReturnThis(),
      selectAll: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      executeTakeFirst: jest.fn(),
      execute: jest.fn(),
      innerJoin: jest.fn().mockReturnThis(),
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setContext: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: 'DATABASE', useValue: mockDb },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('должен быть определён', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('должен вернуть список пользователей', async () => {
      const mockUsers = [
        { id: 1, username: 'admin', email: 'admin@test.com', role_id: 1, role: 'admin' },
        { id: 2, username: 'user', email: 'user@test.com', role_id: 2, role: 'warehouse' },
      ];
      mockDb.execute.mockResolvedValueOnce(mockUsers);

      const result = await service.findAll();
      expect(result).toEqual(mockUsers);
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('должен вернуть пользователя по ID', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce({
        id: 1, username: 'admin', email: 'admin@test.com', role_id: 1, role: 'admin',
      });

      const result = await service.findById(1);
      expect(result).toHaveProperty('username', 'admin');
    });
    it('должен выбросить ошибку, если пользователь не найден', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(null);
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('должен выбросить ошибку, если пользователь уже существует', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce({ id: 1, username: 'admin' });
      await expect(
        service.create({ username: 'admin', password: 'pass', email: 'a@a.com', role: 'admin' }),
      ).rejects.toThrow(ConflictException);
    });
    it('должен успешно создать пользователя', async () => {
      mockDb.executeTakeFirst
        .mockResolvedValueOnce(null) // пользователь не найден
        .mockResolvedValueOnce({ id: 1 }) // роль admin
        .mockResolvedValueOnce({ id: 5, username: 'new_user', email: 'new@test.com', role_id: 1 });

      const result = await service.create({
        username: 'new_user', password: 'pass', email: 'new@test.com', role: 'admin',
      });
      expect(result).toHaveProperty('username', 'new_user');
      expect(result).toHaveProperty('role', 'admin');
    });
  });

  describe('remove', () => {
    it('должен удалить пользователя', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce({ id: 1, username: 'admin' });
      const result = await service.remove(1);
      expect(result).toHaveProperty('message', 'Пользователь удалён');
    });
    it('должен выбросить ошибку, если пользователь не найден', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});