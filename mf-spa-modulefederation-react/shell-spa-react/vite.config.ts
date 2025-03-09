import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { analyzer } from 'vite-bundle-analyzer';
import federation from '@originjs/vite-plugin-federation';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        analyzer(),
        federation({
            name: 'host-app',
            remotes: {
                remote_app: 'http://localhost:5001/assets/remoteEntry.js',
                remote_app_lazy: 'http://localhost:5002/assets/remoteEntry.js',
            },
            shared: ['react', 'react-dom'],
        }),
    ],
    // build: {
    //     rollupOptions: {
    //         // disable treeshake for getting the largest bundle size - for performance profiling
    //         treeshake: false,
    //     },
    // },
});
