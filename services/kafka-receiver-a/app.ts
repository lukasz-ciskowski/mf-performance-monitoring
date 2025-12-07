import express, { Express } from 'express';
import './instrumentation';
import cors from 'cors';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { Kafka } from 'kafkajs';
import { Pool } from 'pg';

const logger = logs.getLogger('kafka-receiver-a');

const PORT: number = parseInt(process.env.PORT || '8085');
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:29092').split(',');

const app: Express = express();

app.use(cors());

const kafka = new Kafka({
    clientId: 'kafka-receiver-a',
    brokers: KAFKA_BROKERS,
});
const consumer = kafka.consumer({ groupId: 'test-group-a' });

app.listen(PORT, async () => {
    await pool.connect();
    console.log(`PostgreSQL connected successfully`);

    await pool.query('CREATE TABLE IF NOT EXISTS kafka_receiver_a (id SERIAL PRIMARY KEY, message VARCHAR(255))');

    console.log(`Listening for requests on http://localhost:${PORT}`);
});

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'user',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
});

async function listen() {
    await consumer.connect();
    await consumer.subscribe({ topic: 'random-number-topic-a', fromBeginning: true });
    console.log('Kafka consumer connected and subscribed to topic');

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log(`Received message: ${message.value?.toString()}`);

            await pool.query('INSERT INTO kafka_receiver_a(message) VALUES($1)', [message.value?.toString()]);

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
