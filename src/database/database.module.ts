// src/database/database.module.ts
// Модуль базы данных, который можно импортировать в другие части приложения
import { Module, Global } from '@nestjs/common';
import { db } from './database.provider';

@Global() // Делаем модуль глобальным, чтобы не импортировать в каждом модуле
@Module({
  providers: [
    {
      provide: 'DATABASE',
      useValue: db,
    },
  ],
  exports: ['DATABASE'],
})
export class DatabaseModule {}