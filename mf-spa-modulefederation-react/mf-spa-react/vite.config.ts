import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        federation({
            name: 'remote-app',
            filename: 'remoteEntry.js',
            exposes: {
                './RemoteApp': './src/App.tsx',
            },
            shared: ['react', 'react-dom'],
        }),
    ],
    build: {
        target: 'esnext', //browsers can handle the latest ES features
        rollupOptions: {
            // disable treeshake for getting the largest bundle size - for performance profiling
            treeshake: false,
        },
    },
});
