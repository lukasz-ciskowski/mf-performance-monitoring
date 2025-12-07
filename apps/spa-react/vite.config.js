import { defineConfig } from 'vite';
import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import { resolve } from 'node:path';
import { dependencies } from './package.json';

// Plugin to simulate slow TTFB
const slowTTFBPlugin = (delay = 500) => ({
    name: 'slow-ttfb',
    configureServer(server) {
        server.middlewares.use((req, res, next) => {
            const originalWrite = res.write;
            const originalEnd = res.end;
            let firstByteDelayed = false;

            res.write = function (...args) {
                if (!firstByteDelayed) {
                    firstByteDelayed = true;
                    console.log(`[TTFB Delay] ${req.method} ${req.url} - delaying first byte by ${delay}ms`);
                    setTimeout(() => {
                        originalWrite.apply(res, args);
                    }, delay);
                } else {
                    originalWrite.apply(res, args);
                }
            };

            res.end = function (...args) {
                if (!firstByteDelayed && args.length > 0) {
                    firstByteDelayed = true;
                    console.log(`[TTFB Delay] ${req.method} ${req.url} - delaying response by ${delay}ms`);
                    setTimeout(() => {
                        originalEnd.apply(res, args);
                    }, delay);
                } else {
                    originalEnd.apply(res, args);
                }
            };

            next();
        });
    },
});

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [TanStackRouterVite({ autoCodeSplitting: true }), viteReact(), tailwindcss()],
    test: {
        globals: true,
        environment: 'jsdom',
    },
    // optimizeDeps: {
    //     include: Object.keys(
    //         dependencies
    //     ),
    // },
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
                target: 'http://127.0.0.1:8080',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/file-service/, ''),
            },
            '/db-service': {
                target: 'http://127.0.0.1:8083',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/db-service/, ''),
            },
        },
    },
});
