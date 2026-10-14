-- FinFix datos DE DEMOSTRACIÓN (gastos de ejemplo).
-- NO se carga en QA ni en PROD: solo en el docker-compose.yml de desarrollo local.
-- Requiere haber ejecutado antes schema.sql y seed.sql.

INSERT INTO expenses (id, title, category_id, expense_type, estimated_amount, due_date, priority, status, actual_paid_amount, paid_at, notes) VALUES
(1, 'Alquiler Departamento', 1, 'FIJO', 280000.00, (TO_CHAR(CURRENT_DATE, 'YYYY-MM') || '-10')::DATE, 'ALTA', 'PENDIENTE', NULL, NULL, 'Transferencia al dueño antes del 10'),
(2, 'Aguas Cordobesas', 2, 'FIJO', 14200.00, (TO_CHAR(CURRENT_DATE, 'YYYY-MM') || '-28')::DATE, 'MEDIA', 'PENDIENTE', NULL, NULL, 'Factura de agua del mes (vence a fin de mes)'),
(3, 'Remera Deportiva (Cuota 1/3)', 3, 'EVENTUAL', 55000.00, (TO_CHAR(CURRENT_DATE, 'YYYY-MM') || '-18')::DATE, 'BAJA', 'PAGADO', 55000.00, CURRENT_TIMESTAMP, 'Cuota 1 de 3 abonada a término')
ON CONFLICT DO NOTHING;

INSERT INTO payments (id, expense_id, amount, payment_date, note) VALUES
(1, 3, 55000.00, CURRENT_TIMESTAMP, 'Pago de Cuota 1 de 3 registrado')
ON CONFLICT DO NOTHING;

SELECT setval('expenses_id_seq', (SELECT MAX(id) FROM expenses));
SELECT setval('payments_id_seq', (SELECT MAX(id) FROM payments));
