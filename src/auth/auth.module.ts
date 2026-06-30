// Модуль авторизации
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService], // Экспортируем, чтобы другие модули могли использовать
})
export class AuthModule {}