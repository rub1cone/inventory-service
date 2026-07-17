import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // wagger
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
  console.log(`Swagger документация: http://localhost:${port}/api/docs`);
}
bootstrap();