// Настройки  токенов 
import * as dotenv from 'dotenv';
import { Kysely } from 'kysely';

dotenv.config();

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'default-secret-key',
  expiresIn: 86400,
};

