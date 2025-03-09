import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { analyzer } from 'vite-bundle-analyzer';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), analyzer()],
    build: {
        rollupOptions: {
            // disable treeshake for getting the largest bundle size - for performance profiling
            treeshake: false,
        },
    },
});
