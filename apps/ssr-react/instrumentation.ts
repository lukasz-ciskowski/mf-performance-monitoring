// Manual OpenTelemetry setup for Next.js (not Vercel approach)
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Dynamic import to avoid issues with ESM/CJS - use default exports
        const sdkNode = await import('@opentelemetry/sdk-trace-node');
        const instHttp = await import('@opentelemetry/instrumentation-http');
        const resourcesModule = await import('@opentelemetry/resources');
        const semconv = await import('@opentelemetry/semantic-conventions');
        const traceExporterModule = await import('@opentelemetry/exporter-trace-otlp-http');
        const metricExporterModule = await import('@opentelemetry/exporter-metrics-otlp-http');
        const sdkMetricsModule = await import('@opentelemetry/sdk-metrics');

        const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';

        const resource = resourcesModule.default.Resource.default().merge(
            new resourcesModule.default.Resource({
                [semconv.default.SEMRESATTRS_SERVICE_NAME]: 'ssr-react',
                [semconv.default.SEMRESATTRS_SERVICE_VERSION]: process.env.SERVICE_VERSION || '1.0.0',
                'service.namespace': 'frontend',
                'service.instance.id': process.env.HOSTNAME || 'localhost',
            }),
        );

        const sdk = new sdkNode.default.NodeSDK({
            resource,
            traceExporter: new traceExporterModule.default.OTLPTraceExporter({
                url: `${otlpEndpoint}/v1/traces`,
            }),
            metricReader: new sdkMetricsModule.default.PeriodicExportingMetricReader({
                exporter: new metricExporterModule.default.OTLPMetricExporter({
                    url: `${otlpEndpoint}/v1/metrics`,
                }),
            }),
            instrumentations: [
                new instHttp.default.HttpInstrumentation({
                    ignoreIncomingRequestHook: (req) => {
                        // Ignore health checks and static assets
                        const url = req.url || '';
                        return url.includes('_next') || url.includes('favicon') || url === '/health';
                    },
                }),
            ],
        });

        sdk.start();
        console.log('OpenTelemetry initialized for ssr-react (manual setup)');

        // Graceful shutdown
        process.on('SIGTERM', () => {
            sdk.shutdown()
                .then(() => console.log('OpenTelemetry terminated'))
                .catch((error: Error) => console.log('Error terminating OpenTelemetry', error))
                .finally(() => process.exit(0));
        });
    }
}
