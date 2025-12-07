import { StrictMode, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './components/ErrorBoundary';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

import './styles.css';
// import FrontendTracer from './utils/telemetry/FrontendTracer.ts';
import './utils/telemetry/web-vitals.ts';
import './utils/telemetry/navigation-metrics.ts';
import { startRouteSwitch } from './utils/telemetry/navigation-metrics';
// import { initWebVitalsMonitoring } from './utils/telemetry/webVitalsMetrics.ts';
// import { initRUMMetrics } from './utils/telemetry/rumMetrics.ts';

// Initialize OpenTelemetry tracing
// export const provider = FrontendTracer();

// Initialize Web Vitals monitoring (LCP, FID, INP, CLS, FCP, TTFB)
// initWebVitalsMonitoring();

// Initialize RUM (Real User Monitoring) metrics
// initRUMMetrics();

// Create a new router instance
const router = createRouter({
    routeTree,
    context: {},
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultStructuralSharing: true,
    defaultPreloadStaleTime: 0,
});

// Track route changes for navigation metrics
router.subscribe('onBeforeLoad', (event) => {
    const toPath = event.toLocation.pathname;
    startRouteSwitch(toPath);
});

// Create React Query client
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            staleTime: 0,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: false,
        },
    },
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

// Render the app
const rootElement = document.getElementById('app');
if (rootElement && !rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <StrictMode>
            <ErrorBoundary>
                <QueryClientProvider client={queryClient}>
                    <Suspense
                        fallback={
                            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                                <div className="text-center">
                                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                                    <p className="text-gray-600">Loading...</p>
                                </div>
                            </div>
                        }
                    >
                        <RouterProvider router={router} />
                    </Suspense>
                </QueryClientProvider>
            </ErrorBoundary>
        </StrictMode>,
    );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
