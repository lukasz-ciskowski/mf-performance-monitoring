'use client';

import { useEffect, useRef } from 'react';
import { completeRouteSwitch } from '../utils/telemetry/navigation-metrics';

interface UsePageRenderMetricsOptions {
    pageName: string;
}

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
