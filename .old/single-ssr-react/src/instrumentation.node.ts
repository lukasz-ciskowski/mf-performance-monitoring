import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

// For troubleshooting, set the log level to DiagLogLevel.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const sdk = new NodeSDK({
    // traceExporter: new ConsoleSpanExporter(),
    // metricReader: new PeriodicExportingMetricReader({
    //     exporter: new ConsoleMetricExporter(),
    // }),
    // resource: resourceFromAttributes({
    //     app_name: 'single_ssr_react',
    //     [ATTR_SERVICE_NAME]: 'single_ssr_react',
    // }),
    // spanProcessor: new SimpleSpanProcessor(new OTLPTraceExporter()),
    // autoDetectResources: true,
    // spanProcessors: [spanProcessor],
    // metricReader: metricsReader,
    // traceExporter: exporter,
    // sampler: new AlwaysOnSampler(),
    // resource: resourceFromDetectedResource({
    //     attributes: {
    //         app_name: 'single_ssr_react',
    //         [ATTR_SERVICE_NAME]: 'single_ssr_react',
    //     },
    // }),
    // instrumentations: [new HttpInstrumentation(), new FetchInstrumentation()],
    traceExporter: new OTLPTraceExporter(),
    instrumentations: [
        getNodeAutoInstrumentations({
            // disable fs instrumentation to reduce noise
            '@opentelemetry/instrumentation-fs': {
                enabled: false,
            },
        }),
    ],
    metricReader: new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter(),
    }),
    resource: resourceFromAttributes({
        next_app_name: 'single_ssr_react',
    }),
});
sdk.start();
console.log('OpenTelemetry initialized');

// const loggerProvider = new LoggerProvider();
// const logger = loggerProvider.getLogger('nextjs-logger');

// logger.emit({
//     severityText: 'INFO',
//     body: 'Application started',
// });

// diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
