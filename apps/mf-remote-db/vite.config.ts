import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import { dependencies } from './package.json';
import { dependencies as rootDependencies } from '../package.json';

// https://vite.dev/config/
// eslint-disable-next-line no-empty-pattern
export default defineConfig(({}) => {
    return {
        server: { fs: { allow: ['.'] }, port: 3003 },
        build: {
            target: 'chrome89',
        },
        plugins: [
            federation({
                filename: 'remoteEntry.js',
                name: 'remote',
                exposes: {
                    './remote-db-app': './src/App.tsx',
                },
                remotes: {},
                shared: {
                    react: {
                        requiredVersion: dependencies.react,
                        singleton: true,
                    },
                    zustand: {
                        requiredVersion: rootDependencies.zustand,
                        singleton: true,
                    },
                    '@tanstack/react-query': {
                        requiredVersion: dependencies['@tanstack/react-query'],
                        singleton: true,
                    },
                },
            }),
            react(),
        ],
    };
});
