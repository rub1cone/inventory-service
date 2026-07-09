// Модуль бд, чтобы импортировать
import { Module, Global } from '@nestjs/common';
import { db } from './database.provider';

@Global() 
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