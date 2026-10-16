import { test, expect } from '@playwright/test';

test.describe('Suite 2: Pruebas End-to-End (E2E de Interfaz de Usuario con Chromium)', () => {

    test('1. Navegación inicial: Cargar aplicación y acceder al Dashboard', async ({ page }) => {
        await page.goto('/');

        // Si aparece la pantalla de bienvenida, hace clic en ver gastos
        const btnVer = page.getByRole('button', { name: /Ver Mis Gastos/i });
        if (await btnVer.isVisible()) {
            await btnVer.click();
        }

        // Comprueba el título principal de la app y el botón de agregar
        await expect(page.getByText('FinFix', { exact: false })).toBeVisible();
        await expect(page.getByRole('button', { name: /Agregar Obligación/i })).toBeVisible();
    });

    test('2. Flujo completo en UI: Crear una obligación, verla en la lista y eliminarla', async ({ page }) => {
        const tituloUnico = `Gasto E2E UI ${Date.now()}`;

        await page.goto('/');
        const btnVer = page.getByRole('button', { name: /Ver Mis Gastos/i });
        if (await btnVer.isVisible()) {
            await btnVer.click();
        }

        // 1. Abrir modal de agregar
        await page.getByRole('button', { name: /Agregar Obligación/i }).click();

        // 2. Llenar formulario y guardar
        await page.getByPlaceholder(/Ej: Alquiler/i).fill(tituloUnico);
        await page.getByPlaceholder(/Ej: 45000/i).fill('35000');
        // Desmarcar "recordar para el próximo mes" para que NO se cree un segundo gasto automático
        await page.getByRole('checkbox').uncheck();
        await page.getByRole('button', { name: 'Guardar Obligación' }).click();

        // Locators por título EXACTO (evita confundirse con otros gastos de la lista)
        const titulo = page.getByRole('heading', { name: tituloUnico, exact: true });
        const fila = page.locator('.expense-item').filter({ has: titulo });

        // 3. Verificar que aparece en la lista de la UI
        await expect(titulo).toBeVisible();

        // 4. Verificar que se GUARDÓ DE VERDAD en la base: al recargar la página sigue estando
        await page.reload();
        const btnVer2 = page.getByRole('button', { name: /Ver Mis Gastos/i });
        if (await btnVer2.isVisible()) {
            await btnVer2.click();
        }
        await expect(titulo).toBeVisible();

        // 5. Eliminar: Playwright por defecto CANCELA los window.confirm, hay que aceptarlo
        page.once('dialog', dialog => dialog.accept());
        await fila.locator('.btn-delete').click();
        await expect(titulo).toHaveCount(0);

        // 6. Verificar que se borró de la base: al recargar sigue sin estar
        await page.reload();
        const btnVer3 = page.getByRole('button', { name: /Ver Mis Gastos/i });
        if (await btnVer3.isVisible()) {
            await btnVer3.click();
        }
        await expect(page.getByRole('button', { name: /Agregar Obligación/i })).toBeVisible();
        await expect(titulo).toHaveCount(0);
    });

    test('3. Validación de UI: Título vacío no debe permitir procesar la obligación', async ({ page }) => {
        await page.goto('/');
        const btnVer = page.getByRole('button', { name: /Ver Mis Gastos/i });
        if (await btnVer.isVisible()) {
            await btnVer.click();
        }

        await page.getByRole('button', { name: /Agregar Obligación/i }).click();

        // Llenar monto pero dejar el concepto vacío
        await page.getByPlaceholder(/Ej: Alquiler/i).fill('');
        await page.getByPlaceholder(/Ej: 45000/i).fill('10000');

        // Apuntamos al botón del modal "Guardar Obligación" y verificamos que está deshabilitado
        const btnGuardar = page.getByRole('button', { name: 'Guardar Obligación' });
        await expect(btnGuardar).toBeDisabled();

        // El modal debe permanecer abierto
        await expect(page.getByPlaceholder(/Ej: Alquiler/i)).toBeVisible();
    });

    test('4. Fechas dinámicas: el selector de vencimientos se arma desde la fecha actual (no está fijo)', async ({ page }) => {
        // Se "viaja" a mediados de diciembre de 2026: el rango debe ser nov-2026 .. feb-2027
        await page.clock.setFixedTime(new Date('2026-12-15T10:00:00'));
        await page.goto('/');
        const btnVer = page.getByRole('button', { name: /Ver Mis Gastos/i });
        if (await btnVer.isVisible()) {
            await btnVer.click();
        }

        await page.getByRole('button', { name: /Agregar Obligación/i }).click();

        const selectorMes = page.locator('select', { has: page.locator('option', { hasText: 'Enero 2027' }) });
        await expect(selectorMes).toContainText(['Noviembre 2026', 'Diciembre 2026', 'Enero 2027', 'Febrero 2027'].join(''));
        await expect(selectorMes).not.toContainText('Agosto 2026');
    });

    test('5. Flujo diario: crear una obligación, pagarla (queda PAGADO y se guarda en la base) y borrarla', async ({ page }) => {
        const tituloUnico = `Gasto E2E Pago ${Date.now()}`;

        // Helper: entrar al listado (la pantalla de bienvenida aparece al cargar o recargar)
        async function irAlListado() {
            const btnVer = page.getByRole('button', { name: /Ver Mis Gastos/i });
            if (await btnVer.isVisible()) {
                await btnVer.click();
            }
        }

        await page.goto('/');
        await irAlListado();

        // 1. Crear la obligación (vence hoy, así el pago es "a término" y no lleva recargo)
        await page.getByRole('button', { name: /Agregar Obligación/i }).click();
        await page.getByPlaceholder(/Ej: Alquiler/i).fill(tituloUnico);
        await page.getByPlaceholder(/Ej: 45000/i).fill('20000');
        await page.getByRole('checkbox').uncheck();   // que NO cree un recordatorio para el mes próximo
        await page.getByRole('button', { name: 'Guardar Obligación' }).click();

        const titulo = page.getByRole('heading', { name: tituloUnico, exact: true });
        const fila = page.locator('.expense-item').filter({ has: titulo });
        await expect(fila).toBeVisible();
        await expect(fila.getByRole('button', { name: 'Pagar' })).toBeVisible();   // todavía no está paga

        // 2. Pagarla: abrir el formulario de pago y confirmar
        await fila.getByRole('button', { name: 'Pagar' }).click();
        await expect(page.getByRole('heading', { name: `Registrar Pago — ${tituloUnico}` })).toBeVisible();
        await page.getByRole('button', { name: 'Confirmar Pago' }).click();

        // 3. El usuario ve el resultado: estado PAGADO y ya no hay botón Pagar en esa fila
        await expect(fila.getByText('PAGADO')).toBeVisible();
        await expect(fila.getByRole('button', { name: 'Pagar' })).toHaveCount(0);

        // 4. Se guardó de verdad en la base: al recargar sigue PAGADO
        await page.reload();
        await irAlListado();
        await expect(fila.getByText('PAGADO')).toBeVisible();

        // 5. Limpiar lo que creó (el confirm del navegador hay que aceptarlo) y comprobarlo
        page.once('dialog', dialog => dialog.accept());
        await fila.locator('.btn-delete').click();
        await expect(titulo).toHaveCount(0);
        await page.reload();
        await irAlListado();
        await expect(titulo).toHaveCount(0);
    });

});
