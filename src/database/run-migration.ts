import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { databaseConfig } from '../config/database.config';

async function runMigration() {
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

  // Импортируем и запускаем миграцию
  const { up } = await import('./migrations/001_initial_schema.js');

  try {
    await up(db);
    console.log(' Все миграции выполнены успешно');
  } catch (error) {
    console.error(' Ошибка при миграции:', error);
    throw error;
  } finally {
    await db.destroy();
  }
}
runMigration().catch(() => process.exit(1));