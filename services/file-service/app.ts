import express, { Express } from 'express';
import './instrumentation';
import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import { promises as fs } from 'fs';
import path from 'path';
import cors from 'cors';
import { collectDefaultMetrics, Registry } from 'prom-client';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';

const logger = logs.getLogger('file-service');
const tracer = trace.getTracer('file-service');

const PORT: number = parseInt(process.env.PORT || '8080');
const app: Express = express();

app.use(cors());

app.get('/file', async (req, res) => {
    const startTime = Date.now();

    logger.emit({
        severityNumber: SeverityNumber.INFO,
        body: 'Received request to read file',
    });
    try {
        const fileContent = await tracer.startActiveSpan('file-read-operation', async (readSpan) => {
            readSpan.addEvent('starting-file-read');
            const content = await fs.readFile(path.join(__dirname, 'file.txt'), 'utf-8');
            await new Promise((resolve) => setTimeout(resolve, Math.random() * 2500 + 500)); // Simulate random delay between 500ms and 3s
            readSpan.addEvent('finished-file-read');
            readSpan.end();
            return content;
        });

        const endTime = Date.now();
        logger.emit({
            severityNumber: SeverityNumber.INFO,
            body: `File read successfully in ${endTime - startTime} ms`,
        });
        res.json({ status: 200, data: fileContent });
    } catch (error) {
        logger.emit({
            severityNumber: SeverityNumber.ERROR,
            body: `Error reading file: ${(error as Error).message}`,
        });
        res.status(500).json({ status: 500, message: 'Error reading file' });
    }
});

app.listen(PORT, () => {
    console.log(`Listening for requests on http://localhost:${PORT}`);
});

const register = new Registry();
collectDefaultMetrics({ register });

// Expose /metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});
