import express, { Express } from 'express';
import './instrumentation';
import cors from 'cors';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { Kafka } from 'kafkajs';
import { Pool } from 'pg';

const logger = logs.getLogger('kafka-receiver-a');

const PORT: number = parseInt(process.env.PORT || '8085');
const app: Express = express();

app.use(cors());

const kafka = new Kafka({
    clientId: 'kafka-receiver-a',
    brokers: ['kafka:9092'],
});
const consumer = kafka.consumer({ groupId: 'test-group-a' });

app.listen(PORT, async () => {
    console.log(`Listening for requests on http://localhost:${PORT}`);
});

const pool = new Pool({
    user: 'user',
    host: 'postgres',
    database: 'postgres',
    password: 'password',
    port: 5432,
});

async function listen() {
    await consumer.connect();
    await consumer.subscribe({ topic: 'random-number-topic-a', fromBeginning: true });
    console.log('Kafka consumer connected and subscribed to topic');

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log(`Received message: ${message.value?.toString()}`);

            await pool.query('INSERT INTO hello(message) VALUES($1)', [message.value?.toString()]);

            logger.emit({
                severityNumber: SeverityNumber.INFO,
                body: `Kafka message successfully received with ${message.value?.toString()} value`,
            });
        },
    });
}

listen().catch((error) => {
    console.error('Error in Kafka consumer:', error);
    logger.emit({
        severityNumber: SeverityNumber.ERROR,
        body: `Error in Kafka consumer: ${(error as Error).message}`,
    });
});
