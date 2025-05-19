import { CompositePropagator, W3CBaggagePropagator, W3CTraceContextPropagator } from '@opentelemetry/core';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ZoneContextManager } from '@opentelemetry/context-zone';

const FrontendTracer = () => {
    const provider = new WebTracerProvider({
        resource: resourceFromAttributes({
            [ATTR_SERVICE_NAME]: 'spa-react',
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
    const webTracer = provider.getTracer('example-tracer-web');

    registerInstrumentations({
        tracerProvider: provider,
        instrumentations: [
            new FetchInstrumentation({
                propagateTraceHeaderCorsUrls: [
                    /.+/g, // Regex to match your backend URLs
                ],
                applyCustomAttributesOnSpan: (span, request, response) => {
                    if (response instanceof Response) {
                        const url = response.url;
                        const service = url.split('/')[3]; // Extract the service name from the URL
                        span.setAttribute('peer.service', service);
                    }
                },
            }),
        ],
    });

    return webTracer;
};

export default FrontendTracer;
