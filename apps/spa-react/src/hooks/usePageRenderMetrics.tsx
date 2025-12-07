import { useEffect, useRef, useState } from 'react';
import { completeRouteSwitch } from '../utils/telemetry/navigation-metrics';

interface UsePageRenderMetricsOptions {
    pageName: string;
}

/**
 * Hook to automatically track page render metrics
 * Place this at the top of your page components
 *
 * @example
 * ```tsx
 * function MyPage() {
 *   usePageRenderMetrics({ pageName: 'MyPage' });
 *   return <div>My Page Content</div>;
 * }
 * ```
 */

export function usePageRenderMetrics(options: UsePageRenderMetricsOptions) {
    const { pageName } = options;
    const hasTrackedInitialRender = useRef<boolean>(false);
    useEffect(() => {
        if (hasTrackedInitialRender.current) {
            return;
        }

        completeRouteSwitch();
        hasTrackedInitialRender.current = true;
    }, [pageName]);
}

// /**
//  * Hook to track async operations within a page
//  * Useful for tracking data fetching, processing, etc.
//  *
//  * @example
//  * ```tsx
//  * function MyPage() {
//  *   const { startTracking, completeTracking } = useAsyncOperationMetrics('MyPage');
//  *
//  *   useEffect(() => {
//  *     startTracking('data-fetch');
//  *     fetchData().then(() => {
//  *       completeTracking('data-fetch', { recordCount: 10 });
//  *     });
//  *   }, []);
//  *
//  *   return <div>My Page Content</div>;
//  * }
//  * ```
//  */
// export function useAsyncOperationMetrics(pageName: string) {
//     const operationTimers = useRef<Map<string, number>>(new Map());

//     const startTracking = (operationName: string) => {
//         operationTimers.current.set(operationName, performance.now());
//     };

//     const completeTracking = (operationName: string) => {
//         const startTime = operationTimers.current.get(operationName);
//         if (!startTime) {
//             console.warn(`[useAsyncOperationMetrics] No start time found for operation: ${operationName}`);
//             return;
//         }

//         const duration = performance.now() - startTime;
//         // recordScreenRender(`${pageName}.${operationName}`, duration);

//         operationTimers.current.delete(operationName);
//     };

//     return { startTracking, completeTracking };
// }
