import type { Histogram } from '@opentelemetry/api';
import FrontendTracer, { getMeterProvider, SERVICE_NAME } from './FrontendTracer';

const METER_NAME = 'spa-react-navigation';

// let screenRenderHistogram: Histogram | null = null;
let routeSwitchHistogram: Histogram | null = null;

const HISTOGRAM_BOUNDARIES = {
    // Screen render times typically range from 10ms to 2000ms
    render_ms: [10, 25, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000],
};

interface NavigationState {
    routeStartTime: number | null;
    currentRoute: string | null;
    previousRoute: string | null;
}

const navigationState: NavigationState = {
    routeStartTime: null,
    currentRoute: null,
    previousRoute: null,
};

/**
 * Initialize navigation metrics monitoring
 */
export function initNavigationMetrics() {
    try {
        FrontendTracer();

        const meter = getMeterProvider()!.getMeter(METER_NAME, '1.0.0');

        // screenRenderHistogram = meter.createHistogram('frontend.navigation.screen_render_milliseconds', {
        //     description: 'Time taken to render a screen component in milliseconds',
        //     advice: {
        //         explicitBucketBoundaries: HISTOGRAM_BOUNDARIES.render_ms,
        //     },
        // });

        routeSwitchHistogram = meter.createHistogram('frontend.navigation.route_switch_milliseconds', {
            description: 'Time taken to switch between routes in milliseconds',
            advice: {
                explicitBucketBoundaries: HISTOGRAM_BOUNDARIES.render_ms,
            },
        });

        console.info('[Navigation Metrics] Monitoring initialized');
    } catch (error) {
        console.error('[Navigation Metrics] Failed to initialize:', error);
    }
}

/**
 * Record the time taken to render a screen component
 * @param componentName - Name of the component/screen being rendered
 * @param renderTime - Time in milliseconds
 * @param metadata - Additional metadata (e.g., dataFetched, fromCache)
 */
// export function recordScreenRender(componentName: string, renderTime: number) {
//     if (!screenRenderHistogram) {
//         console.warn('[Navigation Metrics] Screen render histogram not initialized');
//         return;
//     }

//     try {
//         const attributes: Record<string, string | number> = {
//             'screen.name': componentName,
//             'service.name': SERVICE_NAME,
//             'http.route': window.location.pathname,
//         };

//         screenRenderHistogram.record(renderTime, attributes);

//         console.info(`[Navigation Metrics] Screen render: ${componentName}`, {
//             renderTime: renderTime,
//             route: window.location.pathname,
//             attributes,
//         });
//     } catch (error) {
//         console.error('[Navigation Metrics] Error recording screen render:', error);
//     }
// }

/**
 * Start tracking a route switch
 * Should be called when navigation begins
 * @param toRoute - The route being navigated to
 */
export function startRouteSwitch(toRoute: string) {
    navigationState.routeStartTime = performance.now();
    navigationState.previousRoute = navigationState.currentRoute;
    navigationState.currentRoute = toRoute;

    console.debug('[Navigation Metrics] Route switch started:', {
        from: navigationState.previousRoute,
        to: toRoute,
    });
}

/**
 * Complete route switch tracking
 * Should be called when the new route is fully rendered and interactive
 * @param metadata - Additional metadata about the navigation
 */
export function completeRouteSwitch() {
    if (navigationState.routeStartTime === null) {
        console.warn('[Navigation Metrics] Route switch not started');
        return;
    }

    try {
        const switchDuration = performance.now() - navigationState.routeStartTime;

        const attributes: Record<string, string | number> = {
            'route.from': navigationState.previousRoute || 'initial',
            'route.to': navigationState.currentRoute || 'unknown',
            'service.name': SERVICE_NAME,
        };

        routeSwitchHistogram!.record(switchDuration, attributes);

        console.info(`[Navigation Metrics] Route switch completed:`, {
            from: navigationState.previousRoute || 'initial',
            to: navigationState.currentRoute,
            duration: switchDuration,
            attributes,
        });

        // Reset the start time
        navigationState.routeStartTime = null;
    } catch (error) {
        console.error('[Navigation Metrics] Error recording route switch:', error);
    }
}

// Initialize metrics on module load
initNavigationMetrics();
