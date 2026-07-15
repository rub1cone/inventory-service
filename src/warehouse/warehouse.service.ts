import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Kysely } from 'kysely';
import { Database } from '../database/database.provider';

@Injectable()
export class WarehouseService {
  constructor(
    @Inject('DATABASE') private readonly db: Kysely<Database>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(WarehouseService.name);
  }

  async getSettings() {
    this.logger.info('Запрос настроек склада');
    const settings = await this.db
      .selectFrom('warehouse_settings')
      .selectAll()
      .orderBy('id', 'desc')
      .limit(1)
      .executeTakeFirst();

    if (!settings) {
      throw new NotFoundException('Настройки склада не найдены');
    }
    return settings;
  }

  async updateCapacity(maxCapacity: number, userId: number) {
    this.logger.info(`Обновление вместимости склада: ${maxCapacity} (пользователь ${userId})`);
    const settings = await this.getSettings();

    await this.db
      .updateTable('warehouse_settings')
      .set({
        max_capacity: maxCapacity,
        updated_by: userId,
        updated_at: new Date(),
      })
      .where('id', '=', settings.id)
      .execute();

    this.logger.info(`Вместимость склада обновлена: ${maxCapacity}`);
    return {
      max_capacity: maxCapacity,
      updated_by: userId,
      message: 'Вместимость склада обновлена',
    };
  }
}