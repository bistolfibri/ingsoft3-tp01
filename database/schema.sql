-- FinFix Database Schema (PostgreSQL) - Versión Actualizada

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    icon VARCHAR(30) DEFAULT 'wallet',
    color VARCHAR(20) DEFAULT '#4F46E5',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monthly_budgets (
    id SERIAL PRIMARY KEY,
    year INT NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    total_budget NUMERIC(12, 2) NOT NULL CHECK (total_budget >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_month_year UNIQUE (year, month)
);

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    category_id INT REFERENCES categories(id) ON DELETE RESTRICT,
    expense_type VARCHAR(20) DEFAULT 'FIJO' CHECK (expense_type IN ('FIJO', 'EVENTUAL')),
    estimated_amount NUMERIC(12, 2) NOT NULL CHECK (estimated_amount > 0),
    due_date DATE NOT NULL,
    priority VARCHAR(10) DEFAULT 'MEDIA' CHECK (priority IN ('BAJA', 'MEDIA', 'ALTA')),
    status VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (status IN ('PENDIENTE', 'PAGADO', 'VENCIDO')),
    actual_paid_amount NUMERIC(12, 2) DEFAULT NULL,
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    expense_id INT REFERENCES expenses(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    note TEXT
);
