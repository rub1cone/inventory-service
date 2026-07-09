-- Заменить на TIMESTAMPTZ ДЛЯ СМЕНЫ ПОЯСОВ И Т.Д.
-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'warehouse', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица товаров
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sku VARCHAR(50) UNIQUE NOT NULL, -- артикул товара
    current_quantity INTEGER NOT NULL DEFAULT 0, -- текущее количество
    min_quantity INTEGER DEFAULT 0, -- минимальный запас
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица операций с товарами (приход/убыль)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    type VARCHAR(20) NOT NULL, -- 'income' (приход) или 'expense' (убыль)
    quantity INTEGER NOT NULL,
    transaction_date DATE NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Таблица настроек склада
CREATE TABLE IF NOT EXISTS warehouse_settings (
    id SERIAL PRIMARY KEY,
    max_capacity INTEGER NOT NULL DEFAULT 10000, -- максимальная вместимость
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- По умолчанию
INSERT INTO warehouse_settings (max_capacity) VALUES (10000)
ON CONFLICT DO NOTHING;