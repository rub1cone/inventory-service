import { Reflector } from '@nestjs/core';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      bufferLogs: true, 
    },
  );
  // Подключаем Pino логгер
  app.useLogger(app.get(Logger));
  // Глобальные guards
  const reflector = app.get(Reflector);
  app.useGlobalGuards(
    new JwtAuthGuard(reflector),
    new RolesGuard(reflector),
  );
  // Настройка Swagger
  const config = new DocumentBuilder()
    .setTitle('Сервис управления запасами')
    .setDescription('API для управления складскими запасами, товарами и пользователями')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Введите JWT токен',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Авторизация', 'Регистрация и вход в систему')
    .addTag('Пользователи', 'Управление пользователями (только admin)')
    .addTag('Товары', 'Управление товарами (admin, accounting)')
    .addTag('Складские операции', 'Приход и убыль товаров')
    .addTag('Настройки склада', 'Управление вместимостью склада')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.APP_PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Сервер запущен на http://localhost:${port}`);
  console.log(`Swagger: http://localhost:${port}/api/docs`);
}

bootstrap();