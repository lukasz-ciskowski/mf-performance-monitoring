import { defineConfig } from 'vite';
import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import { resolve } from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [TanStackRouterVite({ autoCodeSplitting: true }), viteReact(), tailwindcss()],
    test: {
        globals: true,
        environment: 'jsdom',
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3000,
        host: true,
        strictPort: true,
        proxy: {
            '/file-service': {
                target: 'http://file-service:8080',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/file-service/, ''),
            },
            '/db-service': {
                target: 'http://db-service:8083',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/db-service/, ''),
            },
        },
    },
});
