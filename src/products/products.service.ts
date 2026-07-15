import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Kysely } from 'kysely';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Database } from '../database/database.provider';

@Injectable()
export class ProductsService {
  constructor(
    @Inject('DATABASE') private readonly db: Kysely<Database>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProductsService.name);
  }
  async findAll() {
    this.logger.info('Запрос списка всех товаров');
    return this.db.selectFrom('products').selectAll().execute();
  }
  async findById(id: number) {
    this.logger.info(`Запрос товара id=${id}`);
    const product = await this.db
      .selectFrom('products')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    if (!product) {
      this.logger.warn(`Товар id=${id} не найден`);
      throw new NotFoundException('Товар не найден');
    }
    return product;
  }
  async create(dto: CreateProductDto) {
    this.logger.info(`Создание товара: ${dto.name} (SKU: ${dto.sku})`);
    const existingProduct = await this.db
      .selectFrom('products')
      .selectAll()
      .where('sku', '=', dto.sku)
      .executeTakeFirst();
    if (existingProduct) {
      this.logger.warn(`Создание отклонено: товар с SKU ${dto.sku} уже существует`);
      throw new ConflictException('Товар с таким артикулом уже существует');
    }
    const result = await this.db
      .insertInto('products')
      .values({
        name: dto.name,
        description: dto.description || '',
        sku: dto.sku,
        current_quantity: dto.current_quantity || 0,
        min_quantity: dto.min_quantity || 0,
        price: dto.price,
      } as any)
      .returningAll()
      .executeTakeFirst();

    this.logger.info(`Товар "${dto.name}" создан (id: ${result!.id})`);
    return result;
  }

  async update(id: number, dto: UpdateProductDto) {
    this.logger.info(`Обновление товара id=${id}`);

    const product = await this.findById(id);

    const updateData: any = { updated_at: new Date() };
    if (dto.name) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.sku) updateData.sku = dto.sku;
    if (dto.current_quantity !== undefined) updateData.current_quantity = dto.current_quantity;
    if (dto.min_quantity !== undefined) updateData.min_quantity = dto.min_quantity;
    if (dto.price !== undefined) updateData.price = dto.price;
    const result = await this.db
      .updateTable('products')
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
    this.logger.info(`Товар id=${id} обновлён`);
    return result;
  }

  async remove(id: number) {
    this.logger.info(`Удаление товара id=${id}`);
    await this.findById(id);

    await this.db.deleteFrom('products').where('id', '=', id).execute();
    this.logger.info(`Товар id=${id} удалён`);
    return { message: 'Товар удалён' };
  }
}