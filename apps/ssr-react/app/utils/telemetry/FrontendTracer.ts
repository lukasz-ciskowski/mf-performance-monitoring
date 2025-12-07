'use client';

import { WebTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { MeterProvider, PeriodicExportingMetricReader, AggregationTemporality } from '@opentelemetry/sdk-metrics';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { metrics } from '@opentelemetry/api';

let meterProviderInstance: MeterProvider | null = null;
let isInitialized = false;

export function initFrontendTracing() {
    if (typeof window === 'undefined' || isInitialized) return;

    try {
        const resource = resourceFromAttributes({
            [ATTR_SERVICE_NAME]: 'ssr-react',
        });

        const tracerProvider = new WebTracerProvider({
            resource,
            spanProcessors: [
                new SimpleSpanProcessor(
                    new OTLPTraceExporter({
                        url: 'http://localhost:4318/v1/traces',
                    }),
                ),
            ],
        });

        tracerProvider.register();

        const metricExporter = new OTLPMetricExporter({
            url: 'http://localhost:4318/v1/metrics',
            temporalityPreference: AggregationTemporality.DELTA,
        });

        const meterProvider = new MeterProvider({
            resource,
            readers: [
                new PeriodicExportingMetricReader({
                    exporter: metricExporter,
                    exportIntervalMillis: 5000,
                    exportTimeoutMillis: 1000,
                }),
            ],
        });

        metrics.setGlobalMeterProvider(meterProvider);
        meterProviderInstance = meterProvider;

        const heartbeatMeter = meterProvider.getMeter('frontend-heartbeat', '1.0.0');
        const heartbeatCounter = heartbeatMeter.createCounter('frontend.telemetry.heartbeat', {
            description: 'Heartbeat signal to keep telemetry pipeline active',
        });

        setInterval(() => {
            heartbeatCounter.add(1, {
                'service.name': 'ssr-react',
                'telemetry.type': 'heartbeat',
            });
        }, 5000);

        isInitialized = true;
        console.info('[Frontend Telemetry] Tracer and Meter providers initialized for ssr-react');
    } catch (error) {
        console.error('[Frontend Telemetry] Failed to initialize:', error);
    }
}

export function getMeterProvider(): MeterProvider | null {
    return meterProviderInstance;
}
