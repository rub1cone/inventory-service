import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { databaseConfig } from '../config/database.config';
import * as bcrypt from 'bcrypt';

async function seed() {
  const db = new Kysely<any>({
    dialect: new PostgresDialect({
      pool: new Pool({
        host: databaseConfig.host,
        port: databaseConfig.port,
        user: databaseConfig.user,
        password: databaseConfig.password,
        database: databaseConfig.database,
      }),
    }),
  });

  console.log('  Очищаем базу данных...');

  // Используем TRUNCATE с RESTART IDENTITY чтобы сбросить автоинкремент
  await sql`TRUNCATE TABLE inventory_transactions, products, users, warehouse_settings, transaction_types, roles RESTART IDENTITY CASCADE`.execute(db);

  console.log(' База данных очищена (автоинкременты сброшены)');
  console.log('');
  console.log(' Заполняем тестовыми данными...');

  await db
    .insertInto('roles')
    .values([
      { name: 'admin', description: 'Администратор системы' },
      { name: 'warehouse', description: 'Сотрудник склада' },
      { name: 'accounting', description: 'Сотрудник бухгалтерии' },
    ])
    .execute();
  console.log(' Роли созданы (id: 1=admin, 2=warehouse, 3=accounting)');

  const adminHash = await bcrypt.hash('admin123', 10);
  const accHash = await bcrypt.hash('acc123', 10);
  const storeHash = await bcrypt.hash('store123', 10);

  const users = await db
    .insertInto('users')
    .values([
      {
        username: 'admin',
        password_hash: adminHash,
        email: 'admin@example.com',
        role_id: 1, // admin
      },
      {
        username: 'accountant',
        password_hash: accHash,
        email: 'acc@example.com',
        role_id: 3, // accounting
      },
      {
        username: 'storekeeper',
        password_hash: storeHash,
        email: 'store@example.com',
        role_id: 2, // warehouse
      },
    ] as any)
    .returning(['id', 'username', 'email', 'role_id'])
    .execute();

  console.log(' Пользователи созданы:');
  console.log('   admin / admin123 (роль: admin)');
  console.log('   accountant / acc123 (роль: accounting)');
  console.log('   storekeeper / store123 (роль: warehouse)');
  users.forEach((u: any) => console.log(`   id=${u.id} - ${u.username} (${u.email})`));

  await db
    .insertInto('transaction_types')
    .values([
      { name: 'income', description: 'Приход товара на склад' },
      { name: 'expense', description: 'Убыль товара со склада' },
    ])
    .execute();

  console.log(' Типы операций созданы (id: 1=income, 2=expense)');

  const products = await db
    .insertInto('products')
    .values([
      {
        name: 'Ноутбук Lenovo ThinkPad',
        description: 'Рабочий ноутбук для сотрудников',
        sku: 'LAP-001',
        current_quantity: 50,
        min_quantity: 5,
        price: 75000.00,
      },
      {
        name: 'Монитор Dell 27"',
        description: 'Монитор для рабочего места',
        sku: 'MON-001',
        current_quantity: 30,
        min_quantity: 3,
        price: 35000.00,
      },
      {
        name: 'Клавиатура Logitech',
        description: 'Беспроводная клавиатура',
        sku: 'KEY-001',
        current_quantity: 100,
        min_quantity: 10,
        price: 5000.00,
      },
      {
        name: 'Мышь Logitech',
        description: 'Беспроводная мышь',
        sku: 'MOU-001',
        current_quantity: 80,
        min_quantity: 8,
        price: 3000.00,
      },
      {
        name: 'Бумага А4 (пачка)',
        description: 'Офисная бумага, 500 листов',
        sku: 'PAP-001',
        current_quantity: 200,
        min_quantity: 20,
        price: 500.00,
      },
    ] as any)
    .returning(['id', 'name', 'sku', 'current_quantity', 'price'])
    .execute();

  console.log(' Товары созданы:');
  products.forEach((p: any) =>
    console.log(`   ${p.id} - ${p.name} (SKU: ${p.sku}, кол-во: ${p.current_quantity}, цена: ${p.price} ₽)`),
  );

  const transactions = await db
    .insertInto('inventory_transactions')
    .values([
      {
        product_id: 1,
        user_id: 2,     // accountant
        type_id: 1,     // income
        quantity: 30,
        transaction_date: new Date('2026-07-01'),
        comment: 'Начальная поставка ноутбуков',
      },
      {
        product_id: 1,
        user_id: 2,
        type_id: 1,
        quantity: 20,
        transaction_date: new Date('2026-07-05'),
        comment: 'Дополнительная поставка',
      },
      {
        product_id: 1,
        user_id: 3,     // storekeeper
        type_id: 2,     // expense
        quantity: 5,
        transaction_date: new Date('2026-07-10'),
        comment: 'Выдача в отдел разработки',
      },
      {
        product_id: 2,
        user_id: 2,
        type_id: 1,
        quantity: 30,
        transaction_date: new Date('2026-07-01'),
        comment: 'Поставка мониторов',
      },
      {
        product_id: 3,
        user_id: 2,
        type_id: 1,
        quantity: 100,
        transaction_date: new Date('2026-07-02'),
        comment: 'Поставка клавиатур',
      },
      {
        product_id: 3,
        user_id: 3,
        type_id: 2,
        quantity: 15,
        transaction_date: new Date('2026-07-12'),
        comment: 'Выдача новым сотрудникам',
      },
      {
        product_id: 4,
        user_id: 2,
        type_id: 1,
        quantity: 80,
        transaction_date: new Date('2026-07-02'),
        comment: 'Поставка мышей',
      },
      {
        product_id: 4,
        user_id: 3,
        type_id: 2,
        quantity: 10,
        transaction_date: new Date('2026-07-12'),
        comment: 'Выдача новым сотрудникам',
      },
      {
        product_id: 5,
        user_id: 2,
        type_id: 1,
        quantity: 200,
        transaction_date: new Date('2026-07-03'),
        comment: 'Поставка бумаги на квартал',
      },
      {
        product_id: 5,
        user_id: 3,
        type_id: 2,
        quantity: 30,
        transaction_date: new Date('2026-07-14'),
        comment: 'Выдача в отделы',
      },
    ] as any)
    .returning(['id', 'product_id', 'type_id', 'quantity', 'comment'])
    .execute();

  console.log(' Складские операции созданы:');
  transactions.forEach((t: any) => {
    const type = t.type_id === 1 ? ' ПРИХОД' : ' УБЫЛЬ';
    console.log(`   ${t.id} - ${type}: товар ${t.product_id}, кол-во: ${t.quantity}, "${t.comment}"`);
  });

  await db
    .insertInto('warehouse_settings')
    .values({
      max_capacity: 10000,
      updated_by: 1,
    } as any)
    .execute();

  console.log(' Настройки склада созданы (вместимость: 10000)');
  console.log('');
  console.log(' База данных успешно заполнена!');
  console.log(` Итого: 3 роли, ${users.length} пользователя, 2 типа операций, ${products.length} товаров, ${transactions.length} операций`);

  await db.destroy();
}

seed().catch((error) => {
  console.error(' Ошибка:', error);
  process.exit(1);
});