import express, { Express } from 'express';
import './instrumentation';
import cors from 'cors';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';

const PORT: number = parseInt(process.env.PORT || '8087');
const app: Express = express();

const FILE_SERVICE_URL = process.env.FILE_SERVICE_URL || 'http://localhost:8080';
const DB_SERVICE_URL = process.env.DB_SERVICE_URL || 'http://localhost:8083';
const KAFKA_SERVICE_URL = process.env.KAFKA_SERVICE_URL || 'http://localhost:8084';

const logger = logs.getLogger('bff-service');

app.use(cors());

app.get('/file', async (req, res) => {
    const startTime = Date.now();

    logger.emit({
        severityNumber: SeverityNumber.INFO,
        body: 'Received request to read file through BFF',
    });

    try {
        const fileContent = await fetch(`${FILE_SERVICE_URL}/file`);
        const fileResponse = await fileContent.json();

        const endTime = Date.now();
        logger.emit({
            severityNumber: SeverityNumber.INFO,
            body: `File read through BFF successfully in ${endTime - startTime} ms`,
        });

        res.json(fileResponse);
    } catch (error) {
        logger.emit({
            severityNumber: SeverityNumber.ERROR,
            body: `Error reading file through BFF: ${(error as Error).message}`,
        });
        res.status(500).json({ status: 500, message: 'Error reading file' });
    }
});

app.get('/db', async (req, res) => {
    const startTime = Date.now();

    logger.emit({
        severityNumber: SeverityNumber.INFO,
        body: 'Received request to read from databases through BFF',
    });

    try {
        const dbContent = await fetch(`${DB_SERVICE_URL}/db`);
        const dbResponse = await dbContent.json();

        const endTime = Date.now();
        logger.emit({
            severityNumber: SeverityNumber.INFO,
            body: `Database read through BFF successfully in ${endTime - startTime} ms`,
        });

        res.json(dbResponse);
    } catch (error) {
        logger.emit({
            severityNumber: SeverityNumber.ERROR,
            body: `Error reading from databases through BFF: ${(error as Error).message}`,
        });
        res.status(500).json({ status: 500, message: 'Error reading from databases' });
    }
});

app.get('/kafka', async (req, res) => {
    const startTime = Date.now();

    logger.emit({
        severityNumber: SeverityNumber.INFO,
        body: 'Received request to send message to Kafka through BFF',
    });

    try {
        const kafkaContent = await fetch(`${KAFKA_SERVICE_URL}/kafka`);
        const kafkaResponse = await kafkaContent.json();

        const endTime = Date.now();
        logger.emit({
            severityNumber: SeverityNumber.INFO,
            body: `Kafka message sent through BFF successfully in ${endTime - startTime} ms`,
        });

        res.json(kafkaResponse);
    } catch (error) {
        logger.emit({
            severityNumber: SeverityNumber.ERROR,
            body: `Error sending message to Kafka through BFF: ${(error as Error).message}`,
        });
        res.status(500).json({ status: 500, message: 'Error sending message to Kafka' });
    }
});

app.listen(PORT, () => {
    console.log(`BFF Service listening for requests on http://localhost:${PORT}`);
});
