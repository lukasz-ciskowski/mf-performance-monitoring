import express, { Express } from 'express';
import './instrumentation';
import { metrics, SpanStatusCode, trace } from '@opentelemetry/api';
import { promises as fs } from 'fs';
import path from 'path';

const PORT: number = parseInt(process.env.PORT || '8080');
const app: Express = express();

const tracer = trace.getTracer('file-service');

app.get('/file', async (req, res) => {
    const startTime = Date.now();

    // Create a parent span for the entire operation
    tracer.startActiveSpan('request', async (parentSpan) => {
        try {
            // Create a child span for file reading operation
            const fileContent = await tracer.startActiveSpan('file-read-operation', async (readSpan) => {
                readSpan.addEvent('starting-file-read');
                const content = await fs.readFile(path.join(__dirname, 'file.txt'), 'utf-8');
                readSpan.addEvent('finished-file-read');
                readSpan.end();
                return content;
            });

            // Create a child span for response preparation
            tracer.startActiveSpan('prepare-response', (responseSpan) => {
                responseSpan.addEvent('sending-response');
                res.json({ status: 200, data: fileContent });
                responseSpan.end();
            });

            const endTime = Date.now();
            parentSpan.setAttribute('execution_time_ms', endTime - startTime);
            parentSpan.end();
        } catch (error) {
            parentSpan.recordException(error as Error);
            parentSpan.setStatus({ code: SpanStatusCode.ERROR });
            res.status(500).json({ status: 500, message: 'Error reading file' });
            parentSpan.end();
        }
    });
});

app.listen(PORT, () => {
    console.log(`Listening for requests on http://localhost:${PORT}`);
});
