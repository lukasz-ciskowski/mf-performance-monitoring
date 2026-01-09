import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';

import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';

process.env.OTEL_EXPORTER_OTLP_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317';
// process.env.OTEL_LOG_LEVEL = 'debug';
const sdk = new NodeSDK({
    resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: 'postgres-service',
    }),
    traceExporter: new OTLPTraceExporter(),
    metricReader: new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter(),
    }),
    logRecordProcessor: new SimpleLogRecordProcessor(new OTLPLogExporter()),
    instrumentations: [
        getNodeAutoInstrumentations({
            '@opentelemetry/instrumentation-dns': {
                enabled: false,
            },
            '@opentelemetry/instrumentation-net': {
                enabled: false,
            },
            '@opentelemetry/instrumentation-express': {
                ignoreLayersType: ['middleware' as any],
            },
            '@opentelemetry/instrumentation-http': {
                ignoreIncomingRequestHook: (request: any) => {
                    return request.method === 'OPTIONS';
                },
            },
            '@opentelemetry/instrumentation-pg': {
                enhancedDatabaseReporting: true,
                requestHook: (span: any, queryConfig: any) => {
                    span.setAttribute('peer.service', 'postgres');
                },
            },
        }),
    ],
});

sdk.start();
console.log('Tracing initialized');
