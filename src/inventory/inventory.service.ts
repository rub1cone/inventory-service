import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Kysely } from 'kysely';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Database } from '../database/database.provider';

@Injectable()
export class InventoryService {
  constructor(
    @Inject('DATABASE') private readonly db: Kysely<Database>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(InventoryService.name);
  }

  async findAllTransactions() {
    this.logger.info('Запрос истории всех транзакций');
    return this.db
      .selectFrom('inventory_transactions')
      .innerJoin('products', 'products.id', 'inventory_transactions.product_id')
      .innerJoin('users', 'users.id', 'inventory_transactions.user_id')
      .innerJoin('transaction_types', 'transaction_types.id', 'inventory_transactions.type_id')
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

  async registerIncome(userId: number, dto: CreateTransactionDto) {
    this.logger.info(`Регистрация прихода: товар ${dto.product_id}, количество ${dto.quantity}`);

    const product = await this.db
      .selectFrom('products')
      .selectAll()
      .where('id', '=', dto.product_id)
      .executeTakeFirst();

    if (!product) {
      this.logger.warn(`Приход отклонён: товар ${dto.product_id} не найден`);
      throw new NotFoundException('Товар не найден');
    }

    const typeRecord = await this.db
      .selectFrom('transaction_types')
      .select('id')
      .where('name', '=', 'income')
      .executeTakeFirst();

    if (!typeRecord) {
      throw new NotFoundException('Тип операции "income" не найден');
    }

    const transaction = await this.db
      .insertInto('inventory_transactions')
      .values({
        product_id: dto.product_id,
        user_id: userId,
        type_id: typeRecord.id,
        quantity: dto.quantity,
        transaction_date: new Date(dto.transaction_date),
        comment: dto.comment || '',
      } as any)
      .returningAll()
      .executeTakeFirst();

    const newQuantity = product.current_quantity + dto.quantity;
    await this.db
      .updateTable('products')
      .set({ current_quantity: newQuantity, updated_at: new Date() })
      .where('id', '=', dto.product_id)
      .execute();

    this.logger.info(`Приход выполнен: товар ${product.name}, новое количество: ${newQuantity}`);
    return transaction;
  }

  async registerExpense(userId: number, dto: CreateTransactionDto) {
    this.logger.info(`Регистрация убыли: товар ${dto.product_id}, количество ${dto.quantity}`);

    const product = await this.db
      .selectFrom('products')
      .selectAll()
      .where('id', '=', dto.product_id)
      .executeTakeFirst();

    if (!product) {
      this.logger.warn(`Убыль отклонена: товар ${dto.product_id} не найден`);
      throw new NotFoundException('Товар не найден');
    }

    if (product.current_quantity < dto.quantity) {
      this.logger.warn(`Убыль отклонена: недостаточно товара. Доступно: ${product.current_quantity}, запрошено: ${dto.quantity}`);
      throw new BadRequestException(`Недостаточно товара. Доступно: ${product.current_quantity}, запрошено: ${dto.quantity}`);
    }

    const typeRecord = await this.db
      .selectFrom('transaction_types')
      .select('id')
      .where('name', '=', 'expense')
      .executeTakeFirst();

    if (!typeRecord) {
      throw new NotFoundException('Тип операции "expense" не найден');
    }

    const transaction = await this.db
      .insertInto('inventory_transactions')
      .values({
        product_id: dto.product_id,
        user_id: userId,
        type_id: typeRecord.id,
        quantity: dto.quantity,
        transaction_date: new Date(dto.transaction_date),
        comment: dto.comment || '',
      } as any)
      .returningAll()
      .executeTakeFirst();

    const newQuantity = product.current_quantity - dto.quantity;
    await this.db
      .updateTable('products')
      .set({ current_quantity: newQuantity, updated_at: new Date() })
      .where('id', '=', dto.product_id)
      .execute();
    this.logger.info(`Убыль выполнена: товар ${product.name}, новое количество: ${newQuantity}`);
    return transaction;
  }
}