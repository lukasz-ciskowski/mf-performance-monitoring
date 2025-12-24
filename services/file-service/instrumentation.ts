import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';
import { SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';

process.env.OTEL_EXPORTER_OTLP_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317';
// process.env.OTEL_LOG_LEVEL = 'debug';
const sdk = new NodeSDK({
    resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: 'file-service',
        [ATTR_SERVICE_VERSION]: process.env.SERVICE_VERSION || '1.0.0',
        'service.namespace': 'file-service',
        'service.instance.id': process.env.HOSTNAME || 'localhost',
    }),
    traceExporter: new OTLPTraceExporter({}),
    metricReader: new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter(),
    }),
    logRecordProcessor: new SimpleLogRecordProcessor(new OTLPLogExporter()),
    instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
console.log('Tracing initialized');
