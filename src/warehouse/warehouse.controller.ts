// Обработка HTTP запросов для настроек склада
import { Controller, Get, Patch, Body } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('warehouse')
@Roles('admin') // Только админ может менять настройки
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get('settings')
  async getSettings() {
    return this.warehouseService.getSettings();
  }

  @Patch('settings')
  async updateCapacity(@Body('max_capacity') maxCapacity: number) {
    return this.warehouseService.updateCapacity(maxCapacity);
  }
}