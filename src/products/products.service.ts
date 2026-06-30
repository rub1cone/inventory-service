// Бизнес-логика управления товарами
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(@Inject('DATABASE') private readonly db: Kysely<any>) {}

  // Получить все товары
  async findAll() {
    return this.db
      .selectFrom('products')
      .selectAll()
      .execute();
  }

  // Получить товар по ID
  async findById(id: number) {
    const product = await this.db
      .selectFrom('products')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!product) {
      throw new NotFoundException('Товар не найден');
    }

    return product;
  }

  // Создать новый товар
  async create(dto: CreateProductDto) {
    // Проверяем, нет ли товара с таким SKU (артикулом)
    const existingProduct = await this.db
      .selectFrom('products')
      .selectAll()
      .where('sku', '=', dto.sku)
      .executeTakeFirst();

    if (existingProduct) {
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
      })
      .returningAll()
      .executeTakeFirst();

    return result;
  }

  // Обновить товар
  async update(id: number, dto: UpdateProductDto) {
    const product = await this.findById(id);

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.sku) updateData.sku = dto.sku;
    if (dto.current_quantity !== undefined) updateData.current_quantity = dto.current_quantity;
    if (dto.min_quantity !== undefined) updateData.min_quantity = dto.min_quantity;
    if (dto.price !== undefined) updateData.price = dto.price;
    updateData.updated_at = new Date();

    const result = await this.db
      .updateTable('products')
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    return result;
  }

  // Удалить товар
  async remove(id: number) {
    await this.findById(id);

    await this.db
      .deleteFrom('products')
      .where('id', '=', id)
      .execute();

    return { message: 'Товар удалён' };
  }
}