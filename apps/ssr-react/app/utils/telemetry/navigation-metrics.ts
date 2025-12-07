'use client';

import type { Histogram } from '@opentelemetry/api';
import { getMeterProvider } from './FrontendTracer';

const METER_NAME = 'ssr-react-navigation';
const SERVICE_NAME = 'ssr-react';

// let screenRenderHistogram: Histogram | null = null;
let routeSwitchHistogram: Histogram | null = null;

const HISTOGRAM_BOUNDARIES = {
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

export function initNavigationMetrics() {
    if (typeof window === 'undefined') return;

    try {
        const meterProvider = getMeterProvider();
        if (!meterProvider) {
            console.warn('[Navigation Metrics] MeterProvider not available');
            return;
        }

        const meter = meterProvider.getMeter(METER_NAME, '1.0.0');

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

// export function recordScreenRender(componentName: string, renderTime: number) {
//     if (typeof window === 'undefined') return;
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

export function startRouteSwitch(toRoute: string) {
    if (typeof window === 'undefined') return;

    navigationState.routeStartTime = performance.now();
    navigationState.previousRoute = navigationState.currentRoute;
    navigationState.currentRoute = toRoute;

    console.debug('[Navigation Metrics] Route switch started:', {
        from: navigationState.previousRoute,
        to: toRoute,
    });
}

export function completeRouteSwitch() {
    if (typeof window === 'undefined') return;
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

        routeSwitchHistogram?.record(switchDuration, attributes);

        console.info(`[Navigation Metrics] Route switch completed:`, {
            from: navigationState.previousRoute || 'initial',
            to: navigationState.currentRoute,
            duration: switchDuration,
            attributes,
        });

        navigationState.routeStartTime = null;
    } catch (error) {
        console.error('[Navigation Metrics] Error recording route switch:', error);
    }
}
