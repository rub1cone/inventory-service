import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PinoLogger } from 'nestjs-pino';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
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
      returningAll: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      executeTakeFirst: jest.fn(),
      execute: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setContext: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: 'DATABASE', useValue: mockDb },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('должен быть определён', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('должен вернуть список товаров', async () => {
      const mockProducts = [
        { id: 1, name: 'Ноутбук', sku: 'LAP-001', current_quantity: 10, price: '50000.00' },
      ];
      mockDb.execute.mockResolvedValueOnce(mockProducts);

      const result = await service.findAll();
      expect(result).toEqual(mockProducts);
    });
  });

  describe('findById', () => {
    it('должен выбросить ошибку, если товар не найден', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(null);
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('должен выбросить ошибку, если SKU уже существует', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce({ id: 1, sku: 'LAP-001' });
      await expect(
        service.create({ name: 'Тест', sku: 'LAP-001', price: 100 }),
      ).rejects.toThrow(ConflictException);
    });

    it('должен успешно создать товар', async () => {
      mockDb.executeTakeFirst
        .mockResolvedValueOnce(null) // SKU не найден
        .mockResolvedValueOnce({ id: 1, name: 'Тест', sku: 'NEW-001', price: '100.00' });

      const result = await service.create({ name: 'Тест', sku: 'NEW-001', price: 100 });
      expect(result).toHaveProperty('sku', 'NEW-001');
    });
  });

  describe('remove', () => {
    it('должен выбросить ошибку, если товар не найден', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});