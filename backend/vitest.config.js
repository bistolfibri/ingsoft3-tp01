import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'json-summary'],
            include: ['src/services/**/*.js'],
            thresholds: {
                lines: 80,
                branches: 58
            }
        }
    }
});
