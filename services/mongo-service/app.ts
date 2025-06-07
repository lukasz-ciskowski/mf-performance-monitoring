import express, { Express } from 'express';
import './instrumentation';
import { Db, MongoClient } from 'mongodb';
import cors from 'cors';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';

const logger = logs.getLogger('mongo-service');

const PORT: number = parseInt(process.env.PORT || '8081');
const app: Express = express();

app.use(cors());

// MongoDB connection setup
const MONGO_URI = 'mongodb://mongo:27017';
const DATABASE_NAME = 'mongo-db';
const COLLECTION_NAME = 'mongo-service';

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

    try {
        const randomNumber = Math.floor(Math.random() * 1000);

        const doc = { message: randomNumber, timestamp: new Date() };
        const result = await db!.collection(COLLECTION_NAME).insertOne(doc);
        if (!result.acknowledged) {
            res.status(500).json({ status: 500, message: 'Failed to insert document' });
            return;
        }
        res.json({ randomNumber: doc.message });

        const endTime = Date.now();

        logger.emit({
            severityNumber: SeverityNumber.INFO,
            body: `MongoDB read successfully in ${endTime - startTime} ms`,
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: 'Error reading from database' });
        logger.emit({
            severityNumber: SeverityNumber.ERROR,
            body: `Error reading from MongoDB: ${(error as Error).message}`,
        });
    }
});

app.listen(PORT, () => {
    console.log(`Listening for requests on http://localhost:${PORT}`);
});
