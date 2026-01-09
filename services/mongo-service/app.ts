import express, { Express } from 'express';
import './instrumentation';
import { Db, MongoClient } from 'mongodb';
import cors from 'cors';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { apmMiddleware, recordDbOperation, startTimer } from './apm-metrics';

const logger = logs.getLogger('mongo-service');

const PORT: number = parseInt(process.env.PORT || '8081');
const app: Express = express();

app.use(cors());
app.use(apmMiddleware());

// MongoDB connection setup
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = 'mongo-db';
const COLLECTION_NAME = 'mongo-service';

// Chaos engineering configuration
const SIMULATE_ERRORS = true;
const ERROR_RATE = parseFloat(process.env.MONGO_ERROR_RATE || '0.1'); // 20% default
const SLOW_QUERY_RATE = parseFloat(process.env.MONGO_SLOW_QUERY_RATE || '0.5'); // 30% default
const SLOW_QUERY_DELAY_MS = parseInt(process.env.MONGO_SLOW_QUERY_DELAY_MS || '3000'); // 3 seconds default

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

    const dbTimer = startTimer();
    let dbOperationCompleted = false;

    try {
        // Simulate slow queries
        if (SIMULATE_ERRORS && Math.random() < SLOW_QUERY_RATE) {
            const actualDelay = SLOW_QUERY_DELAY_MS + Math.floor(Math.random() * 2000);
            logger.emit({
                severityNumber: SeverityNumber.WARN,
                body: `Simulating slow MongoDB query - artificial delay of ${actualDelay}ms injected`,
                attributes: {
                    'db.operation': 'insertOne',
                    'db.delay.ms': actualDelay,
                    'db.collection': COLLECTION_NAME,
                    'chaos.type': 'latency_injection',
                },
            });
            await new Promise((resolve) => setTimeout(resolve, actualDelay));
        }

        // Simulate database errors
        if (SIMULATE_ERRORS && Math.random() < ERROR_RATE) {
            const errorTypes = [
                { code: 'MONGO_WRITE_CONCERN_ERROR', message: 'Write concern error - insufficient replicas' },
                { code: 'MONGO_TIMEOUT', message: 'Operation exceeded time limit - query timed out after 30000ms' },
                { code: 'MONGO_NETWORK_ERROR', message: 'Network error - connection pool exhausted' },
                { code: 'MONGO_DUPLICATE_KEY', message: 'E11000 duplicate key error collection' },
                { code: 'MONGO_DISK_FULL', message: 'Disk full error - unable to write to disk' },
            ];
            const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];

            logger.emit({
                severityNumber: SeverityNumber.ERROR,
                body: `MongoDB operation failed: ${errorType.message}`,
                attributes: {
                    'error.type': errorType.code,
                    'error.message': errorType.message,
                    'db.operation': 'insertOne',
                    'db.collection': COLLECTION_NAME,
                    'db.system': 'mongodb',
                    'chaos.type': 'error_injection',
                    'request.duration.ms': Date.now() - startTime,
                },
            });

            recordDbOperation('insertOne', 'mongodb', dbTimer.end(), true);
            dbOperationCompleted = true;

            const error = new Error(errorType.message);
            error.name = errorType.code;
            throw error;
        }

        const randomNumber = Math.floor(Math.random() * 1000);

        const doc = { message: randomNumber, timestamp: new Date() };
        const result = await db!.collection(COLLECTION_NAME).insertOne(doc);

        recordDbOperation('insertOne', 'mongodb', dbTimer.end(), false);
        dbOperationCompleted = true;

        if (!result.acknowledged) {
            logger.emit({
                severityNumber: SeverityNumber.ERROR,
                body: 'MongoDB insert operation not acknowledged',
                attributes: {
                    'db.operation': 'insertOne',
                    'db.collection': COLLECTION_NAME,
                    'error.type': 'WRITE_NOT_ACKNOWLEDGED',
                },
            });
            res.status(500).json({ status: 500, message: 'Failed to insert document' });
            return;
        }
        res.json({ randomNumber: doc.message });

        const endTime = Date.now();

        logger.emit({
            severityNumber: SeverityNumber.INFO,
            body: `MongoDB write operation completed successfully`,
            attributes: {
                'db.operation': 'insertOne',
                'db.collection': COLLECTION_NAME,
                'operation.duration.ms': endTime - startTime,
                'document.id': result.insertedId.toString(),
            },
        });
    } catch (error) {
        if (!dbOperationCompleted) {
            recordDbOperation('insertOne', 'mongodb', dbTimer.end(), true);
        }

        const endTime = Date.now();
        const errorMessage = (error as Error).message;
        const errorName = (error as Error).name;

        logger.emit({
            severityNumber: SeverityNumber.ERROR,
            body: `MongoDB operation failed: ${errorMessage}`,
            attributes: {
                'error.type': errorName,
                'error.message': errorMessage,
                'error.stack': (error as Error).stack,
                'db.operation': 'insertOne',
                'db.collection': COLLECTION_NAME,
                'db.system': 'mongodb',
                'operation.duration.ms': endTime - startTime,
                'operation.failed': true,
            },
        });

        console.log('Error during MongoDB operation:', error);
        res.status(500).json({ status: 500, message: 'Error performing MongoDB operation' });
        return;
    }
});

app.listen(PORT, () => {
    console.log(`Listening for requests on http://localhost:${PORT}`);
});
