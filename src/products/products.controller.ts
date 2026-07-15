import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Товары')
@ApiBearerAuth('JWT-auth')
@Controller('products')
@Roles('admin', 'accounting')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список всех товаров' })
  async findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить товар по ID' })
  @ApiResponse({ status: 404, description: 'Товар не найден' })
  async findById(@Param('id') id: string) {
    return this.productsService.findById(Number(id));
  }

  @Post()
  @ApiOperation({ summary: 'Создать новый товар' })
  @ApiResponse({ status: 201, description: 'Товар создан' })
  @ApiResponse({ status: 409, description: 'Товар с таким SKU уже существует' })
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить данные товара' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(Number(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить товар' })
  async remove(@Param('id') id: string) {
    return this.productsService.remove(Number(id));
  }
}