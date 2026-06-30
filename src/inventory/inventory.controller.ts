// Обработка HTTP запросов для складских операций
import { Controller, Get, Post, Body, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // Получить все операции (только админ)
  @Get('transactions')
  @Roles('admin')
  async findAll() {
    return this.inventoryService.findAllTransactions();
  }

  // Зарегистрировать приход (админ и бухгалтерия)
  @Post('income')
  @Roles('admin', 'accounting')
  async registerIncome(@Request() req: any, @Body() dto: CreateTransactionDto) {
    return this.inventoryService.registerIncome(req.user.sub, dto);
  }

  // Зарегистрировать убыль (админ и склад)
  @Post('expense')
  @Roles('admin', 'warehouse')
  async registerExpense(@Request() req: any, @Body() dto: CreateTransactionDto) {
    return this.inventoryService.registerExpense(req.user.sub, dto);
  }
}