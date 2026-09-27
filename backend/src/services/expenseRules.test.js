//contiene 9 Unit Tests organizados con la estructura AAA (Arrange, Act, Assert).
// Tiene más de 8 tests sobre 4 reglas distintas de FinFix.
// Incluye 1 Test Parametrizado (it.each).  2 Casos de Error y Borde (montos negativos y pagos inválidos).
// 1 Test con MOCK obligatorio (vi.fn()) que prueba la función que refactorizamos recién sin tocar PostgreSQL real.

import { describe, it, expect, vi } from 'vitest';
import {
    isDuplicateExpenseTitle,
    processPaymentData,
    formatMoneyNumber,
    calculateInstallmentDetails,
    calculateCategorizedMetrics,
    determineExpenseStatusAndPriority,
    fetchAndCalculateMetrics,
    calcularDescuentoAntiguedad /*se agregó esta función nueva para demostrar el freno del Quality Gate (sin tests a propósito)*/
} from './expenseRules.js';

describe('FinFix - Suite de Reglas de Negocio Backend', () => {

    // 1. TEST PARAMETRIZADO (Requisito Obligatorio)
    describe('calculateInstallmentDetails - Test Parametrizado', () => {
        it.each([
            { base: 100000, installments: 1, hasInterest: false, rate: 0, expectedTotal: 100000, expectedInstallment: 100000 },
            { base: 100000, installments: 2, hasInterest: false, rate: 0, expectedTotal: 100000, expectedInstallment: 50000 },
            { base: 100000, installments: 3, hasInterest: true, rate: 10, expectedTotal: 110000, expectedInstallment: 36667 },
            { base: 50000, installments: 5, hasInterest: true, rate: 20, expectedTotal: 60000, expectedInstallment: 12000 }
        ])('para base $base en $installments cuotas (interés $hasInterest $rate%), el total es $expectedTotal', ({ base, installments, hasInterest, rate, expectedTotal, expectedInstallment }) => {
            // Arrange & Act
            const result = calculateInstallmentDetails(base, installments, hasInterest, rate);

            // Assert
            expect(result.totalPrice).toBe(expectedTotal);
            expect(result.installmentAmount).toBe(expectedInstallment);
        });
    });

    // 2. CASOS DE ERROR (Requisito Obligatorio)
    describe('processPaymentData - Casos de Error y Borde', () => {
        it('debe lanzar un error si el monto abonado es menor al monto adeudado', () => {
            // Arrange
            const expense = { estimated_amount: 50000, due_date: '2026-08-20' };

            // Act & Assert
            expect(() => {
                processPaymentData(expense, 30000, new Date('2026-08-15'));
            }).toThrow('El pago no puede ser menor al monto adeudado');
        });

        it('debe lanzar un error si se intenta abonar recargo en un pago realizado a término', () => {
            // Arrange
            const expense = { estimated_amount: 50000, due_date: '2026-08-20' };

            // Act & Assert
            expect(() => {
                processPaymentData(expense, 60000, new Date('2026-08-10'));
            }).toThrow('No corresponde abonar recargo porque la fecha de pago fue a término');
        });
    });

    // 3. REGLAS PURAS DE VENCIMIENTO Y DUPLICADOS
    describe('determineExpenseStatusAndPriority', () => {
        it('debe devolver estado VENCIDO y prioridad ALTA cuando la fecha actual superó el vencimiento', () => {
            // Arrange
            const dueDateStr = '2026-08-10';
            const currentDate = new Date('2026-08-20');

            // Act
            const result = determineExpenseStatusAndPriority(dueDateStr, false, currentDate);

            // Assert
            expect(result.status).toBe('VENCIDO');
            expect(result.priority).toBe('ALTA');
        });

        it('debe devolver estado PAGADO y prioridad BAJA si la obligación ya fue abonada', () => {
            // Arrange & Act
            const result = determineExpenseStatusAndPriority('2026-08-10', true);

            // Assert
            expect(result.status).toBe('PAGADO');
            expect(result.priority).toBe('BAJA');
        });
    });

    describe('isDuplicateExpenseTitle', () => {
        it('debe detectar un título duplicado ignorando espacios y diferencias de mayúsculas', () => {
            // Arrange
            const existing = [
                { id: 1, title: 'Alquiler Departamento' },
                { id: 2, title: 'Servicio de Internet' }
            ];

            // Act
            const isDuplicate = isDuplicateExpenseTitle(existing, '  alquiler departamento  ');

            // Assert
            expect(isDuplicate).toBe(true);
        });
    });

    // 4. REGLAS DE MÉTRICAS Y FORMATEO
    describe('calculateCategorizedMetrics', () => {
        it('debe calcular correctamente el porcentaje comprometido y establecer estado EXCEDIDO si supera el presupuesto', () => {
            // Arrange
            const budget = 100000;
            const expenses = [
                { expense_type: 'FIJO', estimated_amount: 80000 },
                { expense_type: 'EVENTUAL', estimated_amount: 30000 }
            ];

            // Act
            const metrics = calculateCategorizedMetrics(budget, expenses);

            // Assert
            expect(metrics.totalCommitted).toBe(110000);
            expect(metrics.percentage).toBe(110);
            expect(metrics.status).toBe('EXCEDIDO');
        });
    });

    describe('formatMoneyNumber', () => {
        it('debe formatear los montos numéricos agregando separadores de miles', () => {
            // Arrange & Act & Assert
            expect(formatMoneyNumber(280000)).toBe('280.000');
        });
    });

    // 5. TEST CON MOCK (Requisito Obligatorio: Inyección de Dependencias con Mock)
    describe('fetchAndCalculateMetrics - Test con MOCK (Doble de Riesgo)', () => {
        it('debe invocar al repositorio inyectado y procesar las métricas sin tocar la BD real', async () => {
            // Arrange: Creamos el Mock del repositorio con vi.fn()
            const mockRepository = {
                findAllExpenses: vi.fn().mockResolvedValue([
                    { id: 1, expense_type: 'FIJO', estimated_amount: 150000, due_date: '2026-08-28' },
                    { id: 2, expense_type: 'EVENTUAL', estimated_amount: 50000, due_date: '2026-08-18' }
                ])
            };
            const totalBudget = 500000;

            // Act: Ejecutamos la función pasando el Mock por parámetro
            const result = await fetchAndCalculateMetrics(mockRepository, totalBudget, '2026-08');

            // Assert: Verificamos tanto la interacción como el resultado
            expect(mockRepository.findAllExpenses).toHaveBeenCalledTimes(1);
            expect(result.totalCommitted).toBe(200000);
            expect(result.available).toBe(300000);
            expect(result.percentage).toBe(40);
        });
    });
    describe('calcularDescuentoAntiguedad', () => {
        it.each([
            { anios: 0, monto: 100000, expectedDiscount: false, expectedRate: 0, expectedFinal: 100000 },
            { anios: 1, monto: 100000, expectedDiscount: true, expectedRate: 5, expectedFinal: 95000 },
            { anios: 3, monto: 100000, expectedDiscount: true, expectedRate: 10, expectedFinal: 90000 },
            { anios: 5, monto: 100000, expectedDiscount: true, expectedRate: 15, expectedFinal: 85000 }
        ])('para $anios años de antigüedad y monto $monto, el descuento es $expectedRate%', ({ anios, monto, expectedDiscount, expectedRate, expectedFinal }) => {
            const result = calcularDescuentoAntiguedad(anios, monto);
            expect(result.tieneDescuento).toBe(expectedDiscount);
            expect(result.porcentaje).toBe(expectedRate);
            expect(result.montoFinal).toBe(expectedFinal);
        });
    });
});
