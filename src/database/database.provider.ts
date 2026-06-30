// src/database/database.provider.ts
// Здесь мы создаём подключение к базе данных через Kysely
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { databaseConfig } from '../config/database.config';

// Создаём пул подключений к PostgreSQL
const pool = new Pool({
  host: databaseConfig.host,
  port: databaseConfig.port,
  user: databaseConfig.user,
  password: databaseConfig.password,
  database: databaseConfig.database,
});

// Создаём экземпляр Kysely с диалектом PostgreSQL
export const db = new Kysely<any>({
  dialect: new PostgresDialect({
    pool,
  }),
});