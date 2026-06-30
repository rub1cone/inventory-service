import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { WarehouseModule } from './warehouse/warehouse.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    InventoryModule,
    WarehouseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}