// Este archivo contiene 5 Unit Tests que prueban las llamadas a la API
//Incluye 1 Test con MOCK (Obligatorio): Mockea la función global fetch de JS usando vi.stubGlobal('fetch', ...) para probar la llamada sin salir a Internet.
// 1 Test Parametrizado (it.each). 2 Casos de Error (respuestas de error 500 y mensajes de validación).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchDashboard, createExpense, deleteExpense } from './api.js';

describe('FinFix Frontend - Suite de Cliente API y Servicios', () => {

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    // 1. TEST CON MOCK OBLIGATORIO (vi.fn() sobre fetch global)
    describe('fetchDashboard - Test con MOCK (HTTP Fetch Mock)', () => {
        it('debe invocar a fetch con la URL correcta y devolver los datos JSON esperados', async () => {
            // Arrange: Mockeamos la función global fetch con vi.stubGlobal / vi.fn
            const mockData = {
                categories: [{ id: 1, name: 'Servicios' }],
                expenses: [{ id: 1, title: 'Luz', estimated_amount: 15000 }],
                budget: 500000
            };

            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockData
            });
            vi.stubGlobal('fetch', mockFetch);

            // Act: Ejecutamos el servicio de la API en el frontend
            const result = await fetchDashboard();

            // Assert: Verificamos la llamada y la respuesta
            expect(mockFetch).toHaveBeenCalledWith('/api/dashboard');
            expect(result).toEqual(mockData);
        });
    });

    // 2. CASO DE ERROR (Requisito Obligatorio)
    describe('fetchDashboard - Caso de Error de Servidor', () => {
        it('debe lanzar una excepción cuando la respuesta HTTP no sea exitosa (ok: false)', async () => {
            // Arrange: Mockeamos fetch para simular un error 500
            const mockFetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 500
            });
            vi.stubGlobal('fetch', mockFetch);

            // Act & Assert
            await expect(fetchDashboard()).rejects.toThrow('Error al obtener datos del servidor');
        });
    });

    // 3. TEST PARAMETRIZADO (Requisito Obligatorio: it.each)
    describe('createExpense - Test Parametrizado para distintos tipos de gastos', () => {
        it.each([
            { title: 'Alquiler', amount: 280000, type: 'FIJO', categoryId: 1 },
            { title: 'Remera', amount: 55000, type: 'EVENTUAL', categoryId: 3 },
            { title: 'Supermercado', amount: 90000, type: 'EVENTUAL', categoryId: 4 }
        ])('envía correctamente la petición POST para $title ($type)', async ({ title, amount, type, categoryId }) => {
            // Arrange
            const expenseInput = { title, estimated_amount: amount, expense_type: type, category_id: categoryId, due_date: '2026-08-28' };
            const mockResponse = { id: 99, ...expenseInput };

            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            });
            vi.stubGlobal('fetch', mockFetch);

            // Act
            const result = await createExpense(expenseInput);

            // Assert
            expect(mockFetch).toHaveBeenCalledWith('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expenseInput)
            });
            expect(result.id).toBe(99);
        });
    });

    // 4. CASO DE ERROR DE VALIDACIÓN DE API
    describe('createExpense - Caso de Error de Validación', () => {
        it('debe lanzar el mensaje de error devuelto por el servidor si falla la creación', async () => {
            // Arrange
            const mockFetch = vi.fn().mockResolvedValue({
                ok: false,
                json: async () => ({ error: 'El monto debe ser mayor a $0' })
            });
            vi.stubGlobal('fetch', mockFetch);

            // Act & Assert
            await expect(createExpense({ title: 'Prueba', estimated_amount: -500 })).rejects.toThrow('El monto debe ser mayor a $0');
        });
    });

    // 5. TEST DE PAGO CON MOCK
    describe('deleteExpense - Test de eliminación', () => {
        it('llama al método DELETE con la URL del ID correspondiente', async () => {
            // Arrange
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ success: true })
            });
            vi.stubGlobal('fetch', mockFetch);

            // Act
            const result = await deleteExpense(5);

            // Assert
            expect(mockFetch).toHaveBeenCalledWith('/api/expenses/5', { method: 'DELETE' });
            expect(result.success).toBe(true);
        });
    });
});