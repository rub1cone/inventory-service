import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { PinoLogger } from 'nestjs-pino';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('InventoryService', () => {
  let service: InventoryService;
  let mockDb: any;
  let mockLogger: any;

  beforeEach(async () => {
    mockDb = {
      selectFrom: jest.fn().mockReturnThis(),
      insertInto: jest.fn().mockReturnThis(),
      updateTable: jest.fn().mockReturnThis(),
      selectAll: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      returningAll: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      executeTakeFirst: jest.fn(),
      execute: jest.fn(),
      innerJoin: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setContext: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: 'DATABASE', useValue: mockDb },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  it('должен быть определён', () => {
    expect(service).toBeDefined();
  });
  describe('registerIncome', () => {
    it('должен выбросить ошибку, если товар не найден', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(null);

      await expect(
        service.registerIncome(1, {
          product_id: 999,
          quantity: 10,
          transaction_date: '2026-07-13',
          comment: 'Тест',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('должен увеличить количество товара при приходе', async () => {
      // Найден товар с количеством 10
      mockDb.executeTakeFirst
        .mockResolvedValueOnce({ id: 1, current_quantity: 10, name: 'Тест' })
        // Найден тип операции income (id=1)
        .mockResolvedValueOnce({ id: 1 })
        // Создана транзакция
        .mockResolvedValueOnce({ id: 1, product_id: 1, quantity: 5 });

      const result = await service.registerIncome(1, {
        product_id: 1,
        quantity: 5,
        transaction_date: '2026-07-13',
        comment: 'Тест',
      });
      expect(result).toHaveProperty('product_id', 1);
      expect(result).toHaveProperty('quantity', 5);
      // Проверяем, что вызывалось обновление количества
      expect(mockDb.set).toHaveBeenCalled();
    });
  });

  describe('registerExpense', () => {
    it('должен выбросить ошибку, если товара недостаточно', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce({
        id: 1,
        current_quantity: 3,
        name: 'Тест',
      });

      await expect(
        service.registerExpense(1, {
          product_id: 1,
          quantity: 10,
          transaction_date: '2026-07-13',
          comment: 'Тест',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});