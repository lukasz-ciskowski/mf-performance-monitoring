import express, { Express } from 'express';
import './instrumentation';
import cors from 'cors';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { Kafka } from 'kafkajs';
import { Db, MongoClient } from 'mongodb';

const logger = logs.getLogger('kafka-receiver-b');

const PORT: number = parseInt(process.env.PORT || '8086');
const app: Express = express();

app.use(cors());

// MongoDB connection setup
const MONGO_URI = 'mongodb://mongo:27017';
const DATABASE_NAME = 'mongo-db';
const COLLECTION_NAME = 'kafka-receiver-b';

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

const kafka = new Kafka({
    clientId: 'kafka-receiver-b',
    brokers: ['kafka:9092'],
});
const consumer = kafka.consumer({ groupId: 'test-group-b' });

app.listen(PORT, async () => {
    console.log(`Listening for requests on http://localhost:${PORT}`);
});

async function listen() {
    await consumer.connect();
    await consumer.subscribe({ topic: 'random-number-topic-b', fromBeginning: true });
    console.log('Kafka consumer connected and subscribed to topic');

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log(`Received message: ${message.value?.toString()}`);

            await db!.collection(COLLECTION_NAME).insertOne({
                message: message.value?.toString(),
                timestamp: new Date(),
            });

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
