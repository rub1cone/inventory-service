-- Удаляем старые таблицы
DROP TABLE IF EXISTS inventory_transactions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS warehouse_settings CASCADE;
DROP TABLE IF EXISTS transaction_types CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Таблица ролей
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

INSERT INTO roles (name, description) VALUES
    ('admin', 'Администратор системы'),
    ('warehouse', 'Сотрудник склада'),
    ('accounting', 'Сотрудник бухгалтерии');

-- Таблица пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Таблица товаров
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sku VARCHAR(50) UNIQUE NOT NULL,
    current_quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER DEFAULT 0,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Таблица типов операций
CREATE TABLE transaction_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

INSERT INTO transaction_types (name, description) VALUES
    ('income', 'Приход товара на склад'),
    ('expense', 'Убыль товара со склада');

-- Таблица складских операций
CREATE TABLE inventory_transactions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    type_id INTEGER NOT NULL REFERENCES transaction_types(id),
    quantity INTEGER NOT NULL,
    transaction_date DATE NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Таблица настроек склада (связана с users)
CREATE TABLE warehouse_settings (
    id SERIAL PRIMARY KEY,
    max_capacity INTEGER NOT NULL DEFAULT 10000,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO warehouse_settings (max_capacity) VALUES (10000);