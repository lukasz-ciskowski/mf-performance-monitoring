import express, { Express } from 'express';
import './instrumentation';
import { Pool } from 'pg';
import cors from 'cors';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';

const logger = logs.getLogger('postgres-service');

const PORT: number = parseInt(process.env.PORT || '8082');
const app: Express = express();

app.use(cors());

// PostgreSQL connection setup
const pool = new Pool({
    user: 'user',
    host: 'postgres',
    database: 'postgres',
    password: 'password',
    port: 5432,
});

app.get('/postgres', async (req, res) => {
    const startTime = Date.now();

    logger.emit({
        severityNumber: SeverityNumber.INFO,
        body: 'Received request to read from PostgreSQL',
    });

    try {
        const randomNumber = Math.floor(Math.random() * 1000);

        await pool.query('INSERT INTO postgres_service (message) VALUES ($1)', [randomNumber]);
        res.json({ randomNumber });
        const endTime = Date.now();

        logger.emit({
            severityNumber: SeverityNumber.INFO,
            body: `PostgreSQL read successfully in ${endTime - startTime} ms`,
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: 'Error reading from PostgreSQL database' });
        logger.emit({
            severityNumber: SeverityNumber.ERROR,
            body: `Error reading from PostgreSQL: ${(error as Error).message}`,
        });
    }
});

app.listen(PORT, async () => {
    await pool.connect();
    console.log(`PostgreSQL connected successfully`);

    await pool.query('CREATE TABLE IF NOT EXISTS postgres_service (id SERIAL PRIMARY KEY, message VARCHAR(255))');

    console.log(`Listening for requests on http://localhost:${PORT}`);
});
