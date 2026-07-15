import { Test, TestingModule } from '@nestjs/testing';
import { WarehouseService } from './warehouse.service';
import { PinoLogger } from 'nestjs-pino';
import { NotFoundException } from '@nestjs/common';

describe('WarehouseService', () => {
  let service: WarehouseService;
  let mockDb: any;
  let mockLogger: any;

  beforeEach(async () => {
    mockDb = {
      selectFrom: jest.fn().mockReturnThis(),
      updateTable: jest.fn().mockReturnThis(),
      selectAll: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
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
        WarehouseService,
        { provide: 'DATABASE', useValue: mockDb },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<WarehouseService>(WarehouseService);
  });
  it('должен быть определён', () => {
    expect(service).toBeDefined();
  });

  describe('getSettings', () => {
    it('должен вернуть настройки склада', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce({ id: 1, max_capacity: 10000, updated_by: null });
      const result = await service.getSettings();
      expect(result).toHaveProperty('max_capacity', 10000);
    });

    it('должен выбросить ошибку, если настройки не найдены', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(null);
      await expect(service.getSettings()).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCapacity', () => {
    it('должен обновить вместимость склада', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce({ id: 1, max_capacity: 10000 });
      const result = await service.updateCapacity(15000, 1);
      expect(result).toHaveProperty('max_capacity', 15000);
      expect(result).toHaveProperty('updated_by', 1);
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });
});