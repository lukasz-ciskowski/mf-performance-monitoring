'use client';

import { useEffect } from 'react';
import { initFrontendTracing } from '../utils/telemetry/FrontendTracer';
import { initNavigationMetrics } from '../utils/telemetry/navigation-metrics';

export function TelemetryInitializer() {
    useEffect(() => {
        initFrontendTracing();
        initNavigationMetrics();
    }, []);

    return null;
}
