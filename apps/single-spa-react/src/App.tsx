// Named imports for increasing bundle size  - for performance profiling
import { Button } from '@mui/material';
import { Home } from '@mui/icons-material';
import './App.css';
import { faro } from '@grafana/faro-react';
import { Suspense } from 'react';
import { lazyWithMetrics } from './LazyWithMetrics';
const AppLazy = lazyWithMetrics(() => import('./App_lazy'), 'AppLazy');

function App() {
    return (
        <>
            <h1>single-SPA-React</h1>
            <div className="card">
                <Button
                    variant="contained"
                    startIcon={<Home />}
                    onClick={() =>
                        faro.api.pushEvent('button-click', { name: 'Hello world' }, undefined, {
                            skipDedupe: true,
                            timestampOverwriteMs: 0,
                        })
                    }
                >
                    Hello world
                </Button>
            </div>
            <Suspense fallback={<div>Loading...</div>}>
                <AppLazy />
            </Suspense>
        </>
    );
}

export default App;
