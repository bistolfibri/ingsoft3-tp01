import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        coverage: {
            provider: 'v8',
            include: ['src/services/**/*.js'],
            thresholds: {
                lines: 65,
                branches: 50
            }
        }
    }
});
