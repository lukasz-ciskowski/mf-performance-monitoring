import { onCLS, onFCP, onFID, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { metrics } from '@opentelemetry/api';
import type { Histogram } from '@opentelemetry/api';

/**
 * Web Vitals metrics configuration aligned with observability guidelines.
 *
 * This module captures Core Web Vitals (LCP, FID/INP, CLS) and additional
 * performance metrics (FCP, TTFB) as OpenTelemetry metrics.
 *
 * Metrics are sent to the OTEL Collector and can be used for:
 * - Frontend performance SLI/SLO tracking
 * - User experience monitoring
 * - Correlation with backend service performance
 *
 * Reference: documentation/frontend-observability.md
 */

const METER_NAME = 'spa-react-web-vitals';
const SERVICE_NAME = 'spa-react';

// Histogram instances for each Web Vital metric
let lcpHistogram: Histogram | null = null;
let fidHistogram: Histogram | null = null;
let inpHistogram: Histogram | null = null;
let clsHistogram: Histogram | null = null;
let fcpHistogram: Histogram | null = null;
let ttfbHistogram: Histogram | null = null;

/**
 * Rating thresholds based on web.dev recommendations
 * These can be adjusted based on SLO targets
 */
const THRESHOLDS = {
    LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint (ms)
    FID: { good: 100, poor: 300 }, // First Input Delay (ms) - legacy
    INP: { good: 200, poor: 500 }, // Interaction to Next Paint (ms)
    CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift (score)
    FCP: { good: 1800, poor: 3000 }, // First Contentful Paint (ms)
    TTFB: { good: 800, poor: 1800 }, // Time to First Byte (ms)
};

type MetricRating = 'good' | 'needs-improvement' | 'poor';

/**
 * Determine the rating of a metric based on its value and thresholds
 */
function getMetricRating(metricName: keyof typeof THRESHOLDS, value: number): MetricRating {
    const threshold = THRESHOLDS[metricName];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
}

/**
 * Send a Web Vitals metric as an OpenTelemetry metric
 * Each metric is recorded as a histogram with:
 * - Metric name, value, rating as attributes
 * - User journey context (mf.name, route)
 * - Navigation type
 * - Threshold-based rating
 */
function sendToOTel(metric: Metric) {
    try {
        // Get the appropriate histogram for this metric
        let histogram: Histogram | null = null;
        switch (metric.name) {
            case 'LCP':
                histogram = lcpHistogram;
                break;
            case 'FID':
                histogram = fidHistogram;
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

        // Build attributes for the metric
        const attributes: Record<string, string | number> = {
            'service.name': SERVICE_NAME,
            'mf.name': SERVICE_NAME,
            'metric.name': metric.name,
            'metric.rating': metric.rating,
            'navigation.type': metric.navigationType,
        };

        // Add current route if available
        if (typeof window !== 'undefined' && window.location) {
            attributes['http.route'] = window.location.pathname;
        }

        // Determine threshold-based rating for alerting
        const metricKey = metric.name as keyof typeof THRESHOLDS;
        if (THRESHOLDS[metricKey]) {
            const thresholdRating = getMetricRating(metricKey, metric.value);
            attributes['threshold.rating'] = thresholdRating;
        }

        // Record the metric value
        // For CLS (dimensionless score), we record it as-is
        // For time-based metrics (LCP, FID, INP, FCP, TTFB), values are in milliseconds
        histogram.record(metric.value, attributes);

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

/**
 * Initialize Web Vitals monitoring
 * Should be called once when the application starts
 */
export function initWebVitalsMonitoring() {
    try {
        // Get the meter from the global meter provider
        const meter = metrics.getMeter(METER_NAME, '1.0.0');

        // Create histograms for each Web Vital metric
        // Using histogram boundaries suitable for web performance metrics

        // LCP: Largest Contentful Paint (milliseconds)
        // Good: ≤2500ms, Poor: >4000ms
        lcpHistogram = meter.createHistogram('frontend.web_vitals.lcp', {
            description: 'Largest Contentful Paint (LCP) in milliseconds',
            unit: 'ms',
        });

        // FID: First Input Delay (milliseconds) - legacy metric
        // Good: ≤100ms, Poor: >300ms
        fidHistogram = meter.createHistogram('frontend.web_vitals.fid', {
            description: 'First Input Delay (FID) in milliseconds',
            unit: 'ms',
        });

        // INP: Interaction to Next Paint (milliseconds)
        // Good: ≤200ms, Poor: >500ms
        inpHistogram = meter.createHistogram('frontend.web_vitals.inp', {
            description: 'Interaction to Next Paint (INP) in milliseconds',
            unit: 'ms',
        });

        // CLS: Cumulative Layout Shift (dimensionless score)
        // Good: ≤0.1, Poor: >0.25
        clsHistogram = meter.createHistogram('frontend.web_vitals.cls', {
            description: 'Cumulative Layout Shift (CLS) score',
            unit: '1',
        });

        // FCP: First Contentful Paint (milliseconds)
        // Good: ≤1800ms, Poor: >3000ms
        fcpHistogram = meter.createHistogram('frontend.web_vitals.fcp', {
            description: 'First Contentful Paint (FCP) in milliseconds',
            unit: 'ms',
        });

        // TTFB: Time to First Byte (milliseconds)
        // Good: ≤800ms, Poor: >1800ms
        ttfbHistogram = meter.createHistogram('frontend.web_vitals.ttfb', {
            description: 'Time to First Byte (TTFB) in milliseconds',
            unit: 'ms',
        });

        // Register Web Vitals callbacks
        // Largest Contentful Paint - measures loading performance
        onLCP(sendToOTel, { reportAllChanges: false });

        // First Input Delay - measures interactivity (legacy, being replaced by INP)
        onFID(sendToOTel, { reportAllChanges: false });

        // Interaction to Next Paint - measures responsiveness
        onINP(sendToOTel, { reportAllChanges: false });

        // Cumulative Layout Shift - measures visual stability
        onCLS(sendToOTel, { reportAllChanges: false });

        // First Contentful Paint - measures perceived loading speed
        onFCP(sendToOTel, { reportAllChanges: false });

        // Time to First Byte - measures server response time
        onTTFB(sendToOTel, { reportAllChanges: false });

        console.info('[Web Vitals] Monitoring initialized for:', SERVICE_NAME);
    } catch (error) {
        console.error('[Web Vitals] Failed to initialize monitoring:', error);
    }
}

/**
 * Export thresholds for testing and documentation
 */
export { THRESHOLDS };
