import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  test: {
    globals: true,
    environment: 'node',
    exclude: [...configDefaults.exclude, 'e2e/**'], // 👈 EXCLUYE PLAYWRIGHT DE VITEST
    coverage: {
      provider: 'v8',
      include: ['src/services/**/*.js'],
      thresholds: {
        lines: 55,
        branches: 70
      }
    }
  }
});
