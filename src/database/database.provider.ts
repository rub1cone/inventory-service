// src/database/database.provider.ts
// Создаём подключение к базе данных через Kysely
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { databaseConfig } from '../config/database.config';

// Интерфейс базы данных для типизации
export interface Database {
  roles: RoleTable;
  users: UserTable;
  products: ProductTable;
  transaction_types: TransactionTypeTable;
  inventory_transactions: InventoryTransactionTable;
  warehouse_settings: WarehouseSettingsTable;
}

// Типы таблиц
interface RoleTable {
  id: number;
  name: string;
  description: string | null;
}

interface UserTable {
  id: number;
  username: string;
  password_hash: string;
  email: string;
  role_id: number; // Было role VARCHAR, теперь role_id INTEGER
  created_at: Date;
  updated_at: Date;
}

interface ProductTable {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  current_quantity: number;
  min_quantity: number;
  price: number;
  created_at: Date;
  updated_at: Date;
}

interface TransactionTypeTable {
  id: number;
  name: string;
  description: string | null;
}

interface InventoryTransactionTable {
  id: number;
  product_id: number;
  user_id: number;
  type_id: number; // Было type VARCHAR, теперь type_id INTEGER
  quantity: number;
  transaction_date: Date;
  comment: string | null;
  created_at: Date;
}

interface WarehouseSettingsTable {
  id: number;
  max_capacity: number;
  updated_by: number | null; // Новое поле — кто изменил
  updated_at: Date;
}

// Создаём пул подключений
const pool = new Pool({
  host: databaseConfig.host,
  port: databaseConfig.port,
  user: databaseConfig.user,
  password: databaseConfig.password,
  database: databaseConfig.database,
});

// Создаём экземпляр Kysely
export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
});