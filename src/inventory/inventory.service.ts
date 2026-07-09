// src/inventory/inventory.service.ts
// Бизнес-логика складских операций
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Database } from '../database/database.provider';

@Injectable()
export class InventoryService {
  constructor(@Inject('DATABASE') private readonly db: Kysely<Database>) {}

  // Получить все операции (с названиями товаров, пользователей и типов)
  async findAllTransactions() {
    return this.db
      .selectFrom('inventory_transactions')
      .innerJoin('products', 'products.id', 'inventory_transactions.product_id')
      .innerJoin('users', 'users.id', 'inventory_transactions.user_id')
      .innerJoin(
        'transaction_types',
        'transaction_types.id',
        'inventory_transactions.type_id',
      )
      .select([
        'inventory_transactions.id',
        'inventory_transactions.quantity',
        'inventory_transactions.transaction_date',
        'inventory_transactions.comment',
        'inventory_transactions.created_at',
        'products.name as product_name',
        'products.sku as product_sku',
        'users.username as user_name',
        'transaction_types.name as type',
      ])
      .orderBy('inventory_transactions.created_at', 'desc')
      .execute();
  }

  // Зарегистрировать приход товара
  async registerIncome(userId: number, dto: CreateTransactionDto) {
    // Проверяем, существует ли товар
    const product = await this.db
      .selectFrom('products')
      .selectAll()
      .where('id', '=', dto.product_id)
      .executeTakeFirst();

    if (!product) {
      throw new NotFoundException('Товар не найден');
    }

    // Получаем id типа 'income'
    const typeRecord = await this.db
      .selectFrom('transaction_types')
      .select('id')
      .where('name', '=', 'income')
      .executeTakeFirst();

    if (!typeRecord) {
      throw new NotFoundException('Тип операции "income" не найден');
    }

    // Создаём запись о приходе
    const transaction = await this.db
      .insertInto('inventory_transactions')
      .values({
        product_id: dto.product_id,
        user_id: userId,
        type_id: typeRecord.id,
        quantity: dto.quantity,
        transaction_date: new Date(dto.transaction_date),
        comment: dto.comment || '',
      } as any) // as any чтобы обойти строгую типизацию для id и created_at
      .returningAll()
      .executeTakeFirst();

    // Обновляем количество товара
    await this.db
      .updateTable('products')
      .set({
        current_quantity: product.current_quantity + dto.quantity,
        updated_at: new Date(),
      })
      .where('id', '=', dto.product_id)
      .execute();

    return transaction;
  }

  // Зарегистрировать убыль товара
  async registerExpense(userId: number, dto: CreateTransactionDto) {
    // Проверяем, существует ли товар
    const product = await this.db
      .selectFrom('products')
      .selectAll()
      .where('id', '=', dto.product_id)
      .executeTakeFirst();

    if (!product) {
      throw new NotFoundException('Товар не найден');
    }

    // Проверяем, достаточно ли товара
    if (product.current_quantity < dto.quantity) {
      throw new BadRequestException(
        `Недостаточно товара. Доступно: ${product.current_quantity}, запрошено: ${dto.quantity}`,
      );
    }

    // Получаем id типа 'expense'
    const typeRecord = await this.db
      .selectFrom('transaction_types')
      .select('id')
      .where('name', '=', 'expense')
      .executeTakeFirst();

    if (!typeRecord) {
      throw new NotFoundException('Тип операции "expense" не найден');
    }

    // Создаём запись об убыли
    const transaction = await this.db
      .insertInto('inventory_transactions')
      .values({
        product_id: dto.product_id,
        user_id: userId,
        type_id: typeRecord.id,
        quantity: dto.quantity,
        transaction_date: new Date(dto.transaction_date),
        comment: dto.comment || '',
      } as any) // as any чтобы обойти строгую типизацию для id и created_at
      .returningAll()
      .executeTakeFirst();

    // Обновляем количество товара
    await this.db
      .updateTable('products')
      .set({
        current_quantity: product.current_quantity - dto.quantity,
        updated_at: new Date(),
      })
      .where('id', '=', dto.product_id)
      .execute();

    return transaction;
  }
}