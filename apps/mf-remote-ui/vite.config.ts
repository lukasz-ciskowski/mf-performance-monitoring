import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import { dependencies } from './package.json';

// https://vite.dev/config/
// eslint-disable-next-line no-empty-pattern
export default defineConfig(({}) => {
    return {
        server: { fs: { allow: ['.'] } },
        build: {
            target: 'chrome89',
        },
        // optimizeDeps: {
        //     include: Object.keys(dependencies),
        // },
        plugins: [
            federation({
                filename: 'remoteEntry.js',
                name: 'remote',
                exposes: {
                    './remote-ui-app': './src/App.tsx',
                },
                remotes: {},
                shared: {
                    react: {
                        requiredVersion: dependencies.react,
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
