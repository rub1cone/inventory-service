// src/config/jwt.config.ts
// Настройки для JWT токенов (авторизация)
import * as dotenv from 'dotenv';

dotenv.config();

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'default-secret-key',
  expiresIn: 86400,
};