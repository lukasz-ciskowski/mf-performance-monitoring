export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { NodeSDK } = await import('@opentelemetry/sdk-node');
        const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
        const { OTLPMetricExporter } = await import('@opentelemetry/exporter-metrics-otlp-http');
        const { PeriodicExportingMetricReader } = await import('@opentelemetry/sdk-metrics');
        const { resourceFromAttributes } = await import('@opentelemetry/resources');
        const { ATTR_SERVICE_NAME } = await import('@opentelemetry/semantic-conventions');
        const { HttpInstrumentation } = await import('@opentelemetry/instrumentation-http');

        const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';

        const resource = resourceFromAttributes({
            [ATTR_SERVICE_NAME]: 'ssr-react',
            'service.version': process.env.SERVICE_VERSION || '1.0.0',
            'service.namespace': 'frontend',
        });

        const sdk = new NodeSDK({
            resource,
            traceExporter: new OTLPTraceExporter({
                url: `${otlpEndpoint}/v1/traces`,
            }),
            metricReader: new PeriodicExportingMetricReader({
                exporter: new OTLPMetricExporter({
                    url: `${otlpEndpoint}/v1/metrics`,
                }),
                exportIntervalMillis: 5000,
            }),
            instrumentations: [
                new HttpInstrumentation({
                    ignoreIncomingRequestHook: (req) => {
                        const url = req.url || '';
                        return url.includes('_next') || url.includes('favicon') || url === '/health';
                    },
                }),
            ],
        });

        sdk.start();
        console.log('[OpenTelemetry] Initialized for ssr-react (server-side)');

        process.on('SIGTERM', () => {
            sdk.shutdown()
                .then(() => console.log('[OpenTelemetry] Shutdown complete'))
                .catch((error: Error) => console.log('[OpenTelemetry] Error during shutdown', error))
                .finally(() => process.exit(0));
        });
    }
}
