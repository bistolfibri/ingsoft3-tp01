-- FinFix Initial Seed Data (Categorías, Presupuesto y Gastos Iniciales)

INSERT INTO categories (id, name, icon, color) VALUES
(1, 'Vivienda', 'home', '#E06D53'),
(2, 'Servicios', 'zap', '#D97706'),
(3, 'Tarjeta', 'credit-card', '#6366F1'),
(4, 'Entretenimiento', 'tv', '#8B5CF6')
ON CONFLICT DO NOTHING;

INSERT INTO monthly_budgets (year, month, total_budget) VALUES
(EXTRACT(YEAR FROM CURRENT_DATE)::INT, EXTRACT(MONTH FROM CURRENT_DATE)::INT, 950000.00)
ON CONFLICT DO NOTHING;

INSERT INTO expenses (id, title, category_id, expense_type, estimated_amount, due_date, priority, status, notes) VALUES
(1, 'Alquiler Departamento', 1, 'FIJO', 280000.00, (TO_CHAR(CURRENT_DATE, 'YYYY-MM') || '-10')::DATE, 'ALTA', 'PENDIENTE', 'Transferencia al dueño antes del 10'),
(2, 'Aguas Cordobesas', 2, 'FIJO', 14200.00, (TO_CHAR(CURRENT_DATE, 'YYYY-MM') || '-05')::DATE, 'ALTA', 'PENDIENTE', 'Factura vencida de prueba'),
(3, 'Remera Deportiva (Cuota 1/3)', 3, 'EVENTUAL', 55000.00, (TO_CHAR(CURRENT_DATE, 'YYYY-MM') || '-18')::DATE, 'MEDIA', 'PENDIENTE', 'Cuota 1 de 3 ($165.000 total)')
ON CONFLICT DO NOTHING;

SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('expenses_id_seq', (SELECT MAX(id) FROM expenses));


