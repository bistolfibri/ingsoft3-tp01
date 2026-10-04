import { test, expect } from '@playwright/test';

// Dirección de la API de QA (por defecto http://localhost:8080)
const API_URL = process.env.API_BASE_URL || 'http://localhost:8080';

test.describe('Suite 1: Pruebas de Integración (Backend + PostgreSQL Real)', () => {

    test('1. GET /api/dashboard responde HTTP 200 y devuelve la estructura de métricas de la BD', async ({ request }) => {
        const response = await request.get(`${API_URL}/api/dashboard`);
        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty('metrics');
        expect(data).toHaveProperty('expenses');
        expect(Array.isArray(data.expenses)).toBe(true);
    });

    test('2. POST /api/expenses guarda en la BD real y DELETE lo elimina', async ({ request }) => {
        const tituloUnico = `Gasto Integracion ${Date.now()}`;
        const nuevoGasto = {
            title: tituloUnico,
            category_id: 1,
            expense_type: 'FIJO',
            estimated_amount: 15000,
            due_date: '2026-10-25',
            priority: 'MEDIA'
        };

        // 1. Alta (POST)
        const postRes = await request.post(`${API_URL}/api/expenses`, { data: nuevoGasto });
        expect(postRes.status()).toBe(201);
        const gastoCreado = await postRes.json();
        expect(gastoCreado.title).toBe(tituloUnico);

        // 2. Verificar existencia en la BD real (GET)
        const getRes = await request.get(`${API_URL}/api/dashboard`);
        expect(getRes.status()).toBe(200);
        const dashData = await getRes.json();
        const existe = dashData.expenses.some(e => e.title === tituloUnico);
        expect(existe).toBe(true);

        // 3. Borrado en la BD (DELETE)
        const deleteRes = await request.delete(`${API_URL}/api/expenses/${gastoCreado.id}`);
        expect(deleteRes.status()).toBe(200);
    });

    test('3. POST /api/expenses con datos inválidos responde error HTTP 400', async ({ request }) => {
        const gastoInvalido = {
            title: '', // Título vacío inválido
            category_id: 1,
            estimated_amount: -500 // Monto negativo inválido
        };

        const response = await request.post(`${API_URL}/api/expenses`, { data: gastoInvalido });
        expect(response.status()).toBe(400);
    });

});
