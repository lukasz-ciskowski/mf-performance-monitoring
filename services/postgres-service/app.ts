import express, { Express } from 'express';
import './instrumentation';
import { metrics, SpanStatusCode, trace } from '@opentelemetry/api';
import { Pool } from 'pg';
import cors from 'cors';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';

const logger = logs.getLogger('mongo-service');
const tracer = trace.getTracer('postgres-service');

const PORT: number = parseInt(process.env.PORT || '8082');
const app: Express = express();

app.use(cors());

// PostgreSQL connection setup
const pool = new Pool({
    user: 'user',
    host: 'postgres',
    database: 'postgres',
    password: 'password',
    port: 5432,
});

app.get('/postgres', async (req, res) => {
    const startTime = Date.now();

    logger.emit({
        severityNumber: SeverityNumber.INFO,
        body: 'Received request to read from PostgreSQL',
    });

    // Create a parent span for the entire operation
    tracer.startActiveSpan('request', async (parentSpan) => {
        try {
            // Query the PostgreSQL database
            const result = await tracer.startActiveSpan('query-postgres', async (querySpan) => {
                querySpan.addEvent('querying-postgres');
                const queryResult = await pool.query('SELECT * FROM hello LIMIT 1');
                querySpan.addEvent('queried-postgres');
                querySpan.end();
                return queryResult.rows[0].message;
            });

            // Create a child span for response preparation
            tracer.startActiveSpan('prepare-response', (responseSpan) => {
                responseSpan.addEvent('sending-response');
                res.json({ status: 200, data: result });
                responseSpan.end();
            });

            const endTime = Date.now();
            parentSpan.setAttribute('execution_time_ms', endTime - startTime);
            parentSpan.end();

            logger.emit({
                severityNumber: SeverityNumber.INFO,
                body: `PostgreSQL read successfully in ${endTime - startTime} ms`,
            });
        } catch (error) {
            parentSpan.recordException(error as Error);
            parentSpan.setStatus({ code: SpanStatusCode.ERROR });
            res.status(500).json({ status: 500, message: 'Error reading from PostgreSQL database' });
            logger.emit({
                severityNumber: SeverityNumber.ERROR,
                body: `Error reading from PostgreSQL: ${(error as Error).message}`,
            });

            parentSpan.end();
        }
    });
});

app.listen(PORT, () => {
    console.log(`Listening for requests on http://localhost:${PORT}`);
});
