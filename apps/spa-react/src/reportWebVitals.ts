import type { Metric } from 'web-vitals';

/**
 * Legacy reportWebVitals function for backwards compatibility
 *
 * Note: The new Web Vitals monitoring is handled by webVitalsMetrics.ts
 * which integrates with OpenTelemetry. This function can still be used
 * for custom logging or analytics endpoints.
 *
 * @param onPerfEntry - Optional callback function to receive Web Vitals metrics
 */
const reportWebVitals = (onPerfEntry?: (metric: Metric) => void) => {
    if (onPerfEntry && onPerfEntry instanceof Function) {
        import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB, onFID }) => {
            onCLS(onPerfEntry);
            onINP(onPerfEntry);
            onFCP(onPerfEntry);
            onLCP(onPerfEntry);
            onTTFB(onPerfEntry);
            onFID(onPerfEntry);
        });
    }
};

export default reportWebVitals;
