// Бизнес-логика складских операций
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class InventoryService {
  constructor(@Inject('DATABASE') private readonly db: Kysely<any>) {}

  // Получить все операции
  async findAllTransactions() {
    return this.db
      .selectFrom('inventory_transactions')
      .innerJoin('products', 'products.id', 'inventory_transactions.product_id')
      .innerJoin('users', 'users.id', 'inventory_transactions.user_id')
      .select([
        'inventory_transactions.id',
        'inventory_transactions.type',
        'inventory_transactions.quantity',
        'inventory_transactions.transaction_date',
        'inventory_transactions.comment',
        'inventory_transactions.created_at',
        'products.name as product_name',
        'products.sku as product_sku',
        'users.username as user_name',
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

    // Создаём запись о приходе
    const transaction = await this.db
      .insertInto('inventory_transactions')
      .values({
        product_id: dto.product_id,
        user_id: userId,
        type: 'income',
        quantity: dto.quantity,
        transaction_date: dto.transaction_date,
        comment: dto.comment || '',
      })
      .returningAll()
      .executeTakeFirst();

    // Обновляем количество товара на складе
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

    // Проверяем, достаточно ли товара на складе
    if (product.current_quantity < dto.quantity) {
      throw new BadRequestException(
        `Недостаточно товара на складе. Доступно: ${product.current_quantity}, запрошено: ${dto.quantity}`
      );
    }

    // Создаём запись об убыли
    const transaction = await this.db
      .insertInto('inventory_transactions')
      .values({
        product_id: dto.product_id,
        user_id: userId,
        type: 'expense',
        quantity: dto.quantity,
        transaction_date: dto.transaction_date,
        comment: dto.comment || '',
      })
      .returningAll()
      .executeTakeFirst();

    // Обновляем количество товара на складе
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