import express, { Express } from 'express';
import './instrumentation';
import cors from 'cors';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { Kafka } from 'kafkajs';

const logger = logs.getLogger('kafka-service');

const PORT: number = parseInt(process.env.PORT || '8084');
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:29092').split(',');

const app: Express = express();

app.use(cors());

const kafka = new Kafka({
    clientId: 'kafka-service',
    brokers: KAFKA_BROKERS,
});
const producer = kafka.producer();

app.get('/kafka', async (req, res) => {
    const startTime = Date.now();

    logger.emit({
        severityNumber: SeverityNumber.INFO,
        body: 'Received request to send the message to Kafka',
    });

    try {
        const randomNumber = Math.floor(Math.random() * 1000);

        // due to limitations to servicegraph collector we are sending the same message to two topics
        await producer.send({
            topic: 'random-number-topic-a',
            messages: [{ value: randomNumber.toString() }],
        });
        await producer.send({
            topic: 'random-number-topic-b',
            messages: [{ value: randomNumber.toString() }],
        });

        res.json({ randomNumber });
        const endTime = Date.now();

        console.log(`Kafka message successfully sent in ${endTime - startTime} ms with value ${randomNumber}`);
        logger.emit({
            severityNumber: SeverityNumber.INFO,
            body: `Kafka message successfully sent in ${endTime - startTime} ms`,
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: 'Error sending message to Kafka' });
        logger.emit({
            severityNumber: SeverityNumber.ERROR,
            body: `Error sending message to Kafka: ${(error as Error).message}`,
        });
    }
});

app.listen(PORT, async () => {
    await producer.connect();
    console.log(`Listening for requests on http://localhost:${PORT}`);
});
