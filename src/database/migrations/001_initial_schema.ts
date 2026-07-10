import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Удаляем старые таблицы 
  await db.schema.dropTable('inventory_transactions').ifExists().execute();
  await db.schema.dropTable('products').ifExists().execute();
  await db.schema.dropTable('users').ifExists().execute();
  await db.schema.dropTable('warehouse_settings').ifExists().execute();
  await db.schema.dropTable('transaction_types').ifExists().execute();
  await db.schema.dropTable('roles').ifExists().execute();
  console.log('  Старые таблицы удалены');

  // Таблица ролей
  await db.schema
    .createTable('roles')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(50)', (col) => col.notNull().unique())
    .addColumn('description', 'text')
    .execute();

  // Добавляем базовые роли
  await db
    .insertInto('roles')
    .values([
      { name: 'admin', description: 'Администратор системы' },
      { name: 'warehouse', description: 'Сотрудник склада' },
      { name: 'accounting', description: 'Сотрудник бухгалтерии' },
    ])
    .execute();
  console.log(' Таблица roles создана');


  //  Таблица пользователей
  await db.schema
    .createTable('users')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('username', 'varchar(50)', (col) => col.notNull().unique())
    .addColumn('password_hash', 'varchar(255)', (col) => col.notNull())
    .addColumn('email', 'varchar(100)', (col) => col.notNull().unique())
    .addColumn('role_id', 'integer', (col) =>
      col.notNull().references('roles.id')
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute();
  console.log(' Таблица users создана');

  //  Таблица товаров
  await db.schema
    .createTable('products')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(100)', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('sku', 'varchar(50)', (col) => col.notNull().unique())
    .addColumn('current_quantity', 'integer', (col) =>
      col.notNull().defaultTo(0)
    )
    .addColumn('min_quantity', 'integer', (col) => col.defaultTo(0))
    .addColumn('price', sql`numeric(10,2)`, (col) =>
      col.notNull().defaultTo(0)
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute();
  console.log(' Таблица products создана');


  //  Таблица типов операций 
  await db.schema
    .createTable('transaction_types')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(50)', (col) => col.notNull().unique())
    .addColumn('description', 'text')
    .execute();

  await db
    .insertInto('transaction_types')
    .values([
      { name: 'income', description: 'Приход товара на склад' },
      { name: 'expense', description: 'Убыль товара со склада' },
    ])
    .execute();
  console.log(' Таблица transaction_types создана');

  // Таблица складских операций
  await db.schema
    .createTable('inventory_transactions')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('product_id', 'integer', (col) =>
      col.notNull().references('products.id')
    )
    .addColumn('user_id', 'integer', (col) =>
      col.notNull().references('users.id')
    )
    .addColumn('type_id', 'integer', (col) =>
      col.notNull().references('transaction_types.id')
    )
    .addColumn('quantity', 'integer', (col) => col.notNull())
    .addColumn('transaction_date', 'date', (col) => col.notNull())
    .addColumn('comment', 'text')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute();
  console.log(' Таблица inventory_transactions создана');


  // Таблица настроек склада
  await db.schema
    .createTable('warehouse_settings')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('max_capacity', 'integer', (col) =>
      col.notNull().defaultTo(10000)
    )
    .addColumn('updated_by', 'integer', (col) =>
      col.references('users.id')
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute();

  // Вставляем настройки по умолчанию
  await db
    .insertInto('warehouse_settings')
    .values({ max_capacity: 10000 })
    .execute();
  console.log(' Таблица warehouse_settings создана');
  console.log('');
  console.log(' Миграция 001  выполнена');
}

// Функция отката
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('warehouse_settings').ifExists().execute();
  await db.schema.dropTable('inventory_transactions').ifExists().execute();
  await db.schema.dropTable('transaction_types').ifExists().execute();
  await db.schema.dropTable('products').ifExists().execute();
  await db.schema.dropTable('users').ifExists().execute();
  await db.schema.dropTable('roles').ifExists().execute();
  console.log(' Миграция 001 откатана: все таблицы удалены');
}