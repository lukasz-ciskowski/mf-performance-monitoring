import type { Histogram, Counter } from '@opentelemetry/api';
import FrontendTracer, { getMeterProvider, SERVICE_NAME } from './FrontendTracer';

const METER_NAME = 'spa-react-endpoint-metrics';

let endpointDurationHistogram: Histogram | null = null;
let endpointRequestCounter: Counter | null = null;
let endpointErrorCounter: Counter | null = null;

interface EndpointMetadata {
    endpoint: string;
    method?: string;
    statusCode?: number;
    success?: boolean;
}

/**
 * Initialize endpoint metrics monitoring
 */
export function initEndpointMetrics() {
    try {
        FrontendTracer();

        const meter = getMeterProvider()!.getMeter(METER_NAME, '1.0.0');
        console.log('🚀 ~ initEndpointMetrics ~ meter:', meter);

        endpointDurationHistogram = meter.createHistogram('frontend.endpoint.duration_milliseconds', {
            description: 'Time taken for endpoint requests to complete in milliseconds',
        });

        endpointRequestCounter = meter.createCounter('frontend.endpoint.requests_total', {
            description: 'Total number of endpoint requests made',
        });

        endpointErrorCounter = meter.createCounter('frontend.endpoint.errors_total', {
            description: 'Total number of failed endpoint requests',
        });

        console.info('[Endpoint Metrics] Monitoring initialized');
    } catch (error) {
        console.error('[Endpoint Metrics] Failed to initialize:', error);
    }
}

/**
 * Record endpoint request metrics
 * @param duration - Request duration in milliseconds
 * @param metadata - Endpoint metadata (endpoint, method, statusCode, success)
 */
export function recordEndpointMetrics(duration: number, metadata: EndpointMetadata) {
    if (!endpointDurationHistogram || !endpointRequestCounter || !endpointErrorCounter) {
        console.warn('[Endpoint Metrics] Metrics not initialized');
        return;
    }

    try {
        const { endpoint, method = 'GET', statusCode = 0, success = true } = metadata;

        const attributes: Record<string, string | number> = {
            'service.name': SERVICE_NAME,
            'http.endpoint': endpoint,
            'http.method': method,
            'http.route': window.location.pathname,
        };

        if (statusCode > 0) {
            attributes['http.status_code'] = statusCode;
            attributes['http.status_class'] = `${Math.floor(statusCode / 100)}xx`;
        }

        attributes['request.success'] = success ? 'true' : 'false';

        // Record duration
        endpointDurationHistogram.record(duration, attributes);

        // Increment request counter
        endpointRequestCounter.add(1, attributes);

        // Increment error counter if request failed
        if (!success) {
            endpointErrorCounter.add(1, attributes);
        }

        console.info(`[Endpoint Metrics] ${method} ${endpoint}:`, {
            duration: `${duration.toFixed(2)}ms`,
            statusCode,
            success,
            route: window.location.pathname,
        });
    } catch (error) {
        console.error('[Endpoint Metrics] Error recording endpoint metrics:', error);
    }
}

/**
 * Create a fetch wrapper that automatically tracks endpoint metrics
 * @param endpoint - The endpoint URL or path
 * @param options - Fetch options
 * @returns Promise with the fetch response
 */
export async function trackedFetch(endpoint: string, options?: RequestInit): Promise<Response> {
    const startTime = performance.now();
    const method = options?.method || 'GET';
    // Capture route immediately to avoid race conditions during navigation
    const currentRoute = window.location.pathname;

    try {
        const response = await fetch(endpoint, options);
        const duration = performance.now() - startTime;

        recordEndpointMetrics(duration, {
            endpoint,
            method,
            statusCode: response.status,
            success: response.ok,
        });

        return response;
    } catch (error) {
        const duration = performance.now() - startTime;

        recordEndpointMetrics(duration, {
            endpoint,
            method,
            statusCode: 0,
            success: false,
        });

        throw error;
    }
}

// Initialize metrics on module load
initEndpointMetrics();
