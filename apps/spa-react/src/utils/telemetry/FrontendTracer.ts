import { CompositePropagator, W3CBaggagePropagator, W3CTraceContextPropagator } from '@opentelemetry/core';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { metrics } from '@opentelemetry/api';

// Singleton provider instances
let tracerProviderInstance: WebTracerProvider | null = null;
let meterProviderInstance: MeterProvider | null = null;

const FrontendTracer = () => {
    if (tracerProviderInstance) {
        return tracerProviderInstance.getTracer('example-tracer-web');
    }

    // Create shared resource
    const resource = resourceFromAttributes({
        [ATTR_SERVICE_NAME]: 'spa-react',
    });

    // Set up Tracer Provider for traces
    const tracerProvider = new WebTracerProvider({
        resource,
        spanProcessors: [new SimpleSpanProcessor(new OTLPTraceExporter())],
    });

    const contextManager = new ZoneContextManager();

    tracerProvider.register({
        contextManager,
        propagator: new CompositePropagator({
            propagators: [new W3CBaggagePropagator(), new W3CTraceContextPropagator()],
        }),
    });

    tracerProviderInstance = tracerProvider;

    // Set up Meter Provider for metrics
    const metricExporter = new OTLPMetricExporter({
        url: 'http://localhost:4318/v1/metrics', // OTEL Collector HTTP endpoint
    });

    const meterProvider = new MeterProvider({
        resource,
        readers: [
            new PeriodicExportingMetricReader({
                exporter: metricExporter,
                exportIntervalMillis: 10000, // Export every 10 seconds
                exportTimeoutMillis: 5000,
            }),
        ],
    });

    // Register the global meter provider
    metrics.setGlobalMeterProvider(meterProvider);
    meterProviderInstance = meterProvider;

    const webTracer = tracerProvider.getTracer('example-tracer-web');

    registerInstrumentations({
        tracerProvider,
        instrumentations: [
            new FetchInstrumentation({
                propagateTraceHeaderCorsUrls: [
                    /.+/g, // Regex to match your backend URLs
                ],
                applyCustomAttributesOnSpan: (span, _request, response) => {
                    if (response instanceof Response) {
                        const url = response.url;
                        const service = url.split('/')[3]; // Extract the service name from the URL
                        span.setAttribute('peer.service', service);
                    }
                },
            }),
        ],
    });

    console.info('[Frontend Telemetry] Tracer and Meter providers initialized');

    return webTracer;
};

/**
 * Get the WebTracerProvider instance
 * @returns The registered WebTracerProvider or null if not initialized
 */
export const getTracerProvider = (): WebTracerProvider | null => {
    return tracerProviderInstance;
};

/**
 * Get the MeterProvider instance
 * @returns The registered MeterProvider or null if not initialized
 */
export const getMeterProvider = (): MeterProvider | null => {
    return meterProviderInstance;
};

export default FrontendTracer;
