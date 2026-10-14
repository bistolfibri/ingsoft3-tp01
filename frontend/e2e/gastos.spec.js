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

});