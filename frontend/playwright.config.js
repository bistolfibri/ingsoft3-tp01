import { defineConfig } from '@playwright/test'

export default defineConfig({
    testDir: './e2e',               // Carpeta donde vivirán nuestras suites de pruebas
    timeout: 60_000,                // Tiempo máximo por test (60 segundos)
    expect: { timeout: 15_000 },    // Tiempo máximo para verificaciones (15 segundos)
    use: {
        baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000', // URL del Frontend de QA
        trace: 'on-first-retry',      // Graba traza si un test reintenta por fallo
        screenshot: 'only-on-failure',// Captura de pantalla automática en caso de falla
    },
    retries: 1,                     // 1 reintento para evitar fallos por demoras de red
    reporter: [['html', { open: 'never' }], ['list']],
})
