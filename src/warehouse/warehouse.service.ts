// Настройки склада
import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { Database } from '../database/database.provider';

@Injectable()
export class WarehouseService {
  constructor(@Inject('DATABASE') private readonly db: Kysely<Database>) {}
  // Получить настройки склада
  async getSettings() {
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
  // Обновить вместимость склада
  async updateCapacity(maxCapacity: number, userId: number) {
    const settings = await this.getSettings();
    await this.db
      .updateTable('warehouse_settings')
      .set({
        max_capacity: maxCapacity,
        updated_by: userId, // Записываем, кто изменил
        updated_at: new Date(),
      })
      .where('id', '=', settings.id)
      .execute();
    return {
      max_capacity: maxCapacity,
      updated_by: userId,
      message: 'Вместимость склада обновлена',
    };
  }
}