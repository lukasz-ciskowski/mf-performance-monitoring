import express, { Express } from 'express';
import './instrumentation';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import cors from 'cors';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';

const PORT: number = parseInt(process.env.PORT || '8083');
const app: Express = express();

const logger = logs.getLogger('db-service');
const tracer = trace.getTracer('db-service');

app.use(cors());

app.get('/db', async (req, res) => {
    const startTime = Date.now();

    logger.emit({
        severityNumber: SeverityNumber.INFO,
        body: 'Received request to read from databases',
    });

    // Create a parent span for the entire operation
    tracer.startActiveSpan('request', async (parentSpan) => {
        try {
            logger.emit({
                severityNumber: SeverityNumber.INFO,
                body: 'Starting to read from MongoDB',
            });

            // Create a child span for file reading operation
            const mongoResponse = await tracer.startActiveSpan('mongo-service-read', async (readSpan) => {
                const content = await fetch('http://mongo-service:8081/mongo');
                readSpan.end();
                return await content.json();
            });

            logger.emit({
                severityNumber: SeverityNumber.INFO,
                body: 'Starting to read from PostgreSQL',
            });

            const postgresResponse = await tracer.startActiveSpan('postgres-service-read', async (readSpan) => {
                const content = await fetch('http://postgres-service:8082/postgres');
                readSpan.end();
                return await content.json();
            });

            // Create a child span for response preparation
            tracer.startActiveSpan('prepare-response', (responseSpan) => {
                responseSpan.addEvent('sending-response');
                res.json({
                    status: 200,
                    data: {
                        mongo: mongoResponse,
                        postgres: postgresResponse,
                    },
                });
                responseSpan.end();
            });

            const endTime = Date.now();
            parentSpan.setAttribute('execution_time_ms', endTime - startTime);
            parentSpan.end();
        } catch (error) {
            parentSpan.recordException(error as Error);
            parentSpan.setStatus({ code: SpanStatusCode.ERROR });
            logger.emit({
                severityNumber: SeverityNumber.ERROR,
                body: `Error reading from databases: ${(error as Error).message}`,
            });
            parentSpan.end();
        }
    });
});

app.listen(PORT, () => {
    console.log(`Listening for requests on http://localhost:${PORT}`);
});
