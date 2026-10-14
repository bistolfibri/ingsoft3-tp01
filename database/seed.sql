-- FinFix Seed (datos MÍNIMOS que la app necesita para funcionar en cualquier entorno)
-- Se puede ejecutar más de una vez sin romper nada (idempotente).

-- Categorías: obligatorias, porque expenses.category_id es una clave foránea hacia esta tabla.
-- La categoría 3 se llama 'Cuota': la lógica de cuotas del frontend compara con ese nombre.
INSERT INTO categories (id, name, icon, color) VALUES
(1, 'Vivienda', 'home', '#E06D53'),
(2, 'Servicios', 'zap', '#D97706'),
(3, 'Cuota', 'credit-card', '#6366F1'),
(4, 'Entretenimiento', 'tv', '#8B5CF6')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, color = EXCLUDED.color;

-- Presupuesto del mes en curso
INSERT INTO monthly_budgets (year, month, total_budget) VALUES
(EXTRACT(YEAR FROM CURRENT_DATE)::INT, EXTRACT(MONTH FROM CURRENT_DATE)::INT, 950000.00)
ON CONFLICT DO NOTHING;

SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
