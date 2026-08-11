-- FinFix Initial Seed Data (Categorías Simplificadas)

INSERT INTO categories (name, icon, color) VALUES
('Vivienda', 'home', '#E06D53'),
('Servicios', 'zap', '#D97706'),
('Tarjeta', 'credit-card', '#6366F1'),
('Entretenimiento', 'tv', '#8B5CF6')
ON CONFLICT DO NOTHING;

INSERT INTO monthly_budgets (year, month, total_budget) VALUES
(EXTRACT(YEAR FROM CURRENT_DATE)::INT, EXTRACT(MONTH FROM CURRENT_DATE)::INT, 520000.00)
ON CONFLICT DO NOTHING;
