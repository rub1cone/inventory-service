import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('warehouse')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get('settings')
  async getSettings() {
    return this.warehouseService.getSettings();
  }

  @Patch('settings')
  async updateCapacity(
    @Request() req: any,
    @Body('max_capacity') maxCapacity: number,
  ) {
    // Передаём userId из токена
    return this.warehouseService.updateCapacity(maxCapacity, req.user.sub);
  }
}