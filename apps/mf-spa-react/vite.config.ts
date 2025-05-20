import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import { dependencies } from './package.json';
import { dependencies as rootDependencies } from '../package.json';

// https://vite.dev/config/
export default defineConfig({
    server: {
        fs: { allow: ['.'] },
        port: 3002,
        host: true,
        strictPort: true,
        proxy: {
            '/file-service': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/file-service/, ''),
            },
            '/db-service': {
                target: 'http://localhost:8083',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/db-service/, ''),
            },
        },
    },
    build: {
        target: 'chrome89',
    },
    plugins: [
        federation({
            name: 'host',
            remotes: {
                remote: {
                    type: 'module',
                    name: 'remote',
                    entry: 'http://localhost:3003/remoteEntry.js',
                    entryGlobalName: 'remote',
                    shareScope: 'default',
                },
            },
            exposes: {},
            filename: 'remoteEntry.js',
            shared: {
                react: {
                    requiredVersion: dependencies.react,
                    singleton: true,
                },
                shared: {
                    requiredVersion: dependencies['shared'],
                    singleton: true,
                },
                zustand: {
                    requiredVersion: rootDependencies.zustand,
                    singleton: true,
                },
            },
        }),
        react(),
    ],
});
