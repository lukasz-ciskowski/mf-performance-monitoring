import express, { Express } from 'express';
import './instrumentation';
import cors from 'cors';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';

const PORT: number = parseInt(process.env.PORT || '8083');
const app: Express = express();

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
            body: 'Starting to read from MongoDB',
        });

        const mongoContent = await fetch('http://mongo-service:8081/mongo');
        const mongoResponse = await mongoContent.json();

        logger.emit({
            severityNumber: SeverityNumber.INFO,
            body: 'Starting to read from PostgreSQL',
        });

        const postgresContent = await fetch('http://postgres-service:8082/postgres');
        const postgresResponse = await postgresContent.json();

        logger.emit({
            severityNumber: SeverityNumber.INFO,
            body: 'Starting to read from Kafka',
        });

        const kafkaContent = await fetch('http://kafka-service:8084/kafka');
        const kafkaResponse = await kafkaContent.json();

        res.json({
            status: 200,
            data: {
                mongo: mongoResponse,
                postgres: postgresResponse,
                kafka: kafkaResponse,
            },
        });
    } catch (error) {
        logger.emit({
            severityNumber: SeverityNumber.ERROR,
            body: `Error reading from databases: ${(error as Error).message}`,
        });
    }
});

app.listen(PORT, () => {
    console.log(`Listening for requests on http://localhost:${PORT}`);
});
