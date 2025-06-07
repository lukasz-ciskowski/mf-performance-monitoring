import { CompositePropagator, W3CBaggagePropagator, W3CTraceContextPropagator } from '@opentelemetry/core';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ZoneContextManager } from '@opentelemetry/context-zone';

const FrontendTracer = () => {
    const provider = new WebTracerProvider({
        resource: resourceFromAttributes({
            [ATTR_SERVICE_NAME]: 'remote-ui-app',
        }),
        spanProcessors: [new SimpleSpanProcessor(new OTLPTraceExporter())],
    });

    const contextManager = new ZoneContextManager();

    provider.register({
        contextManager,
        propagator: new CompositePropagator({
            propagators: [new W3CBaggagePropagator(), new W3CTraceContextPropagator()],
        }),
    });
    const webTracer = provider.getTracer('remote-ui-app-tracer');

    registerInstrumentations({
        tracerProvider: provider,
        instrumentations: [],
    });

    return webTracer;
};

export const FrontendTracerInstance = FrontendTracer();
