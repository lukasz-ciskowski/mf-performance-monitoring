import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
import type { Histogram } from '@opentelemetry/api';
import FrontendTracer, { getMeterProvider, SERVICE_NAME } from './FrontendTracer';

const METER_NAME = 'spa-react-web-vitals';

let lcpHistogram: Histogram | null = null;
let inpHistogram: Histogram | null = null;
let clsHistogram: Histogram | null = null;
let fcpHistogram: Histogram | null = null;
let ttfbHistogram: Histogram | null = null;

// Store last recorded values for periodic refresh
let lastMetricValues: Map<string, { value: number; attributes: Record<string, string | number> }> = new Map();

const THRESHOLDS = {
    LCP: { good: 2500, poor: 4000 },
    INP: { good: 200, poor: 500 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
};

type MetricRating = 'good' | 'needs-improvement' | 'poor';

function getMetricRating(metricName: keyof typeof THRESHOLDS, value: number): MetricRating {
    const threshold = THRESHOLDS[metricName];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
}

const HISTOGRAM_BOUNDARIES = {
    // TTFB typically ranges from ~50ms to ~600ms
    ttfb_ms: [10, 25, 50, 75, 100, 150, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000],
    // FCP/LCP/INP can range from ~300ms to ~8000ms+
    paint_ms: [100, 200, 300, 400, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7000, 8000, 10000],
    cls: [0, 0.01, 0.025, 0.05, 0.075, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.75, 1.0],
};

function sendToOTel(metric: Metric) {
    try {
        let histogram: Histogram | null = null;
        switch (metric.name) {
            case 'LCP':
                histogram = lcpHistogram;
                break;
            case 'INP':
                histogram = inpHistogram;
                break;
            case 'CLS':
                histogram = clsHistogram;
                break;
            case 'FCP':
                histogram = fcpHistogram;
                break;
            case 'TTFB':
                histogram = ttfbHistogram;
                break;
        }

        if (!histogram) {
            console.warn(`[Web Vitals] Histogram not initialized for ${metric.name}`);
            return;
        }

        const attributes: Record<string, string | number> = {
            'metric.name': metric.name,
            'metric.rating': metric.rating,
            'navigation.type': metric.navigationType,
            'service.name': SERVICE_NAME,
        };

        if (typeof window !== 'undefined' && window.location) {
            attributes['http.route'] = window.location.pathname;
        }

        const metricKey = metric.name as keyof typeof THRESHOLDS;
        if (THRESHOLDS[metricKey]) {
            const thresholdRating = getMetricRating(metricKey, metric.value);
            attributes['threshold.rating'] = thresholdRating;
        }

        histogram.record(metric.value, attributes);

        // Store for periodic refresh
        lastMetricValues.set(metric.name, { value: metric.value, attributes });

        console.info(`[Web Vitals] ${metric.name}:`, {
            value: metric.value,
            rating: metric.rating,
            thresholdRating: THRESHOLDS[metricKey] ? getMetricRating(metricKey, metric.value) : 'N/A',
            route: window.location.pathname,
        });
    } catch (error) {
        console.error(`[Web Vitals] Error sending ${metric.name}:`, error);
    }
}

export function initWebVitalsMonitoring() {
    try {
        FrontendTracer();

        const meter = getMeterProvider()!.getMeter(METER_NAME, '1.0.0');

        ttfbHistogram = meter.createHistogram('frontend.web_vitals.ttfb_milliseconds', {
            description: 'Time to First Byte (TTFB) in milliseconds',
        });

        fcpHistogram = meter.createHistogram('frontend.web_vitals.fcp_milliseconds', {
            description: 'First Contentful Paint (FCP) in milliseconds',
        });

        lcpHistogram = meter.createHistogram('frontend.web_vitals.lcp_milliseconds', {
            description: 'Largest Contentful Paint (LCP) in milliseconds',
        });

        clsHistogram = meter.createHistogram('frontend.web_vitals.cls_score', {
            description: 'Cumulative Layout Shift (CLS) score',
        });

        inpHistogram = meter.createHistogram('frontend.web_vitals.inp_milliseconds', {
            description: 'Interaction to Next Paint (INP) in milliseconds',
        });

        onTTFB(sendToOTel, { reportAllChanges: false });
        onFCP(sendToOTel, { reportAllChanges: false });
        onLCP(sendToOTel, { reportAllChanges: false });
        onCLS(sendToOTel, { reportAllChanges: false });
        onINP(sendToOTel, { reportAllChanges: false });

        // Periodic re-recording to maintain histogram state between actual events
        // This ensures Prometheus always sees values, not zeros
        setInterval(() => {
            lastMetricValues.forEach((data, metricName) => {
                let histogram: Histogram | null = null;
                switch (metricName) {
                    case 'LCP':
                        histogram = lcpHistogram;
                        break;
                    case 'INP':
                        histogram = inpHistogram;
                        break;
                    case 'CLS':
                        histogram = clsHistogram;
                        break;
                    case 'FCP':
                        histogram = fcpHistogram;
                        break;
                    case 'TTFB':
                        histogram = ttfbHistogram;
                        break;
                }

                if (histogram) {
                    // Re-record the last known value to keep histogram alive
                    histogram.record(data.value, {
                        ...data.attributes,
                        replay: 'true', // Mark as replayed value
                    });
                    lastMetricValues.delete(metricName);
                }
            });
        }, 5000); // Match the export interval

        console.info('[Web Vitals] Monitoring initialized with periodic refresh');
    } catch (error) {
        console.error('[Web Vitals] Failed to initialize monitoring:', error);
    }
}

export { THRESHOLDS };

initWebVitalsMonitoring();
