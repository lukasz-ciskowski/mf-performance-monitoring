'use client';

import { useEffect } from 'react';
import { initWebVitalsMonitoring } from '../utils/telemetry/web-vitals';

export function WebVitalsMonitor() {
    useEffect(() => {
        initWebVitalsMonitoring();
    }, []);

    return null;
}
