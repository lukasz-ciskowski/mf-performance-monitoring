import express, { Express } from 'express';
import './instrumentation';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import { Db, MongoClient } from 'mongodb';
import cors from 'cors';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';

const logger = logs.getLogger('mongo-service');
const tracer = trace.getTracer('mongo-service');

const PORT: number = parseInt(process.env.PORT || '8081');
const app: Express = express();

app.use(cors());

// MongoDB connection setup
const MONGO_URI = 'mongodb://mongo:27017';
const DATABASE_NAME = 'test';
const COLLECTION_NAME = 'hello';

const client = new MongoClient(MONGO_URI);

let db: Db | null = null;

async function connect() {
    await client.connect();
    db = client.db(DATABASE_NAME);
}
connect()
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });

app.get('/mongo', async (req, res) => {
    const startTime = Date.now();
    if (!db) {
        res.status(500).json({ status: 500, message: 'Database not connected' });
        return;
    }

    logger.emit({
        severityNumber: SeverityNumber.INFO,
        body: 'Received request to read from MongoDB',
    });

    // Create a parent span for the entire operation
    tracer.startActiveSpan('request', async (parentSpan) => {
        try {
            // Query the database
            const document = await tracer.startActiveSpan('query-database', async (querySpan) => {
                querySpan.addEvent('querying-database');
                const result = await db!.collection(COLLECTION_NAME).findOne<{ message: string }>();
                querySpan.addEvent('queried-database');
                querySpan.end();
                return result?.message;
            });

            // Create a child span for response preparation
            tracer.startActiveSpan('prepare-response', (responseSpan) => {
                responseSpan.addEvent('sending-response');
                res.json({ status: 200, data: document });
                responseSpan.end();
            });

            const endTime = Date.now();
            parentSpan.setAttribute('execution_time_ms', endTime - startTime);
            parentSpan.end();

            logger.emit({
                severityNumber: SeverityNumber.INFO,
                body: `MongoDB read successfully in ${endTime - startTime} ms`,
            });
        } catch (error) {
            parentSpan.recordException(error as Error);
            parentSpan.setStatus({ code: SpanStatusCode.ERROR });
            res.status(500).json({ status: 500, message: 'Error reading from database' });
            logger.emit({
                severityNumber: SeverityNumber.ERROR,
                body: `Error reading from MongoDB: ${(error as Error).message}`,
            });

            parentSpan.end();
        }
    });
});

app.listen(PORT, () => {
    console.log(`Listening for requests on http://localhost:${PORT}`);
});
