import { Controller, Get, Patch, Body, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WarehouseService } from './warehouse.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Настройки склада')
@ApiBearerAuth('JWT-auth')
@Controller('warehouse')
@Roles('admin')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Получить настройки склада' })
  async getSettings() {
    return this.warehouseService.getSettings();
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Обновить вместимость склада' })
  async updateCapacity(
    @Request() req: any,
    @Body('max_capacity') maxCapacity: number,
  ) {
    return this.warehouseService.updateCapacity(maxCapacity, req.user.sub);
  }
}