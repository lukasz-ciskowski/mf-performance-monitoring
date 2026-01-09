import express, { Express } from 'express';
import './instrumentation';
import cors from 'cors';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';

const PORT: number = parseInt(process.env.PORT || '8083');
const app: Express = express();

const MONGO_SERVICE_URL = process.env.MONGO_SERVICE_URL || 'http://localhost:8081';
const POSTGRES_SERVICE_URL = process.env.POSTGRES_SERVICE_URL || 'http://localhost:8082';
// Kafka calls moved to BFF; db-service should only aggregate DBs

const logger = logs.getLogger('db-service');

app.use(cors());

app.get('/db', async (req, res) => {
    logger.emit({
        severityNumber: SeverityNumber.INFO,
        body: 'Received request to read from databases',
    });

    try {
        logger.emit({
            severityNumber: SeverityNumber.INFO,
            body: 'Starting to read from PostgreSQL',
        });

        const postgresContent = await fetch(`${POSTGRES_SERVICE_URL}/postgres`);
        const postgresResponse = await postgresContent.json();

        logger.emit({
            severityNumber: SeverityNumber.INFO,
            body: 'Starting to read from MongoDB',
        });

        const mongoContent = await fetch(`${MONGO_SERVICE_URL}/mongo`);
        const mongoResponse = await mongoContent.json();

        res.json({
            status: 200,
            data: {
                mongo: mongoResponse,
                postgres: postgresResponse,
            },
        });
    } catch (error) {
        logger.emit({
            severityNumber: SeverityNumber.ERROR,
            body: `Error reading from databases: ${(error as Error).message}`,
        });
        throw error;
    }
});

app.listen(PORT, () => {
    console.log(`Listening for requests on http://localhost:${PORT}`);
});
