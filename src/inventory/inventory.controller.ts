import { Controller, Get, Post, Body, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Складские операции')
@ApiBearerAuth('JWT-auth')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('transactions')
  @Roles('admin')
  @ApiOperation({ summary: 'Получить историю всех операций (только admin)' })
  async findAll() {
    return this.inventoryService.findAllTransactions();
  }

  @Post('income')
  @Roles('admin', 'accounting')
  @ApiOperation({ summary: 'Зарегистрировать приход товара (admin, accounting)' })
  @ApiResponse({ status: 201, description: 'Приход зарегистрирован' })
  @ApiResponse({ status: 404, description: 'Товар не найден' })
  async registerIncome(@Request() req: any, @Body() dto: CreateTransactionDto) {
    return this.inventoryService.registerIncome(req.user.sub, dto);
  }

  @Post('expense')
  @Roles('admin', 'warehouse')
  @ApiOperation({ summary: 'Зарегистрировать убыль товара (admin, warehouse)' })
  @ApiResponse({ status: 201, description: 'Убыль зарегистрирована' })
  @ApiResponse({ status: 400, description: 'Недостаточно товара' })
  @ApiResponse({ status: 404, description: 'Товар не найден' })
  async registerExpense(@Request() req: any, @Body() dto: CreateTransactionDto) {
    return this.inventoryService.registerExpense(req.user.sub, dto);
  }
}