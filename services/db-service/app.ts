import express, { Express } from 'express';
import './instrumentation';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import cors from 'cors';

const PORT: number = parseInt(process.env.PORT || '8083');
const app: Express = express();

app.use(cors());

const tracer = trace.getTracer('db-service');

app.get('/db', async (req, res) => {
    const startTime = Date.now();

    // Create a parent span for the entire operation
    tracer.startActiveSpan('request', async (parentSpan) => {
        try {
            // Create a child span for file reading operation
            const mongoResponse = await tracer.startActiveSpan('mongo-service-read', async (readSpan) => {
                const content = await fetch('http://mongo-service:8081/mongo');
                readSpan.end();
                return await content.json();
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
            parentSpan.end();
        }
    });
});

app.listen(PORT, () => {
    console.log(`Listening for requests on http://localhost:${PORT}`);
});
