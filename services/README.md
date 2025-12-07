# Backend Services

This directory contains all backend microservices for the microfrontend monitoring project.

## Services

- **file-service** (8080) - File operations service
- **postgres-service** (8082) - PostgreSQL data access wrapper
- **mongo-service** (8081) - MongoDB data access wrapper
- **db-service** (8083) - Database orchestrator (calls postgres & mongo services)
- **kafka-service** (8084) - Kafka producer façade
- **kafka-receiver-a** (8085) - Kafka consumer A (writes to PostgreSQL)
- **kafka-receiver-b** (8086) - Kafka consumer B (writes to MongoDB)
- **bff-service** (8087) - Backend for Frontend (aggregates file, db, kafka services)

## Prerequisites

Before running the services locally, ensure you have:

1. **Infrastructure running** (Postgres, MongoDB, Kafka, OTEL Collector, etc.):
   ```bash
   # From project root - start infrastructure
   docker-compose -f docker-compose.infra.yaml up -d
   
   # Start observability stack
   docker-compose up -d postgres mongo otel-collector prometheus grafana tempo loki
   ```

2. **Node.js** installed (v22 recommended)

3. **Dependencies installed** in each service directory

## Running All Services

### Option 1: Run all services with one command

From the `services` directory:

```bash
# Install dependencies (first time only)
npm install

# Run all services concurrently
npm run dev
```

This will start all 8 services with color-coded output.

### Option 2: Run services individually

```bash
# From services directory
npm run dev:file           # Start only file-service
npm run dev:postgres       # Start only postgres-service
npm run dev:mongo          # Start only mongo-service
npm run dev:db             # Start only db-service
npm run dev:kafka          # Start only kafka-service
npm run dev:kafka-receiver-a
npm run dev:kafka-receiver-b
npm run dev:bff            # Start only bff-service
```

### Option 3: Run services in Docker

```bash
# From project root
docker-compose up --build

# Or run specific services
docker-compose -f docker-compose.services.yaml up --build
```

## Environment Variables

When running locally (outside Docker), services use these defaults:

### OTEL Collector
- `OTEL_EXPORTER_OTLP_ENDPOINT` → `http://localhost:4317`

### Database Connections
- `POSTGRES_HOST` → `localhost`
- `POSTGRES_PORT` → `5432`
- `POSTGRES_USER` → `user`
- `POSTGRES_PASSWORD` → `password`
- `POSTGRES_DB` → `postgres`
- `MONGO_URI` → `mongodb://localhost:27017`

### Kafka
- `KAFKA_BROKERS` → `localhost:29092` (when running locally)

**Note**: Kafka exposes two listeners:
- Port `9092` for Docker internal communication (kafka:9092)
- Port `29092` for localhost access (localhost:29092)

### Service URLs (for inter-service calls)
- `FILE_SERVICE_URL` → `http://localhost:8080`
- `DB_SERVICE_URL` → `http://localhost:8083`
- `KAFKA_SERVICE_URL` → `http://localhost:8084`
- `MONGO_SERVICE_URL` → `http://localhost:8081`
- `POSTGRES_SERVICE_URL` → `http://localhost:8082`

When running in Docker, these are automatically set via `docker-compose.yaml` to use Docker network names (e.g., `postgres` instead of `localhost`).

## Testing Endpoints

### BFF Service (Port 8087)
```bash
# Test file endpoint
curl http://localhost:8087/file

# Test database endpoint
curl http://localhost:8087/db

# Test kafka endpoint
curl http://localhost:8087/kafka
```

### Individual Services
```bash
# File service
curl http://localhost:8080/file

# DB service (aggregates mongo + postgres + kafka)
curl http://localhost:8083/db

# Kafka service
curl http://localhost:8084/kafka

# Mongo service
curl http://localhost:8081/mongo

# Postgres service
curl http://localhost:8082/postgres
```

## Architecture

```
BFF Service (8087)
├── /file   → File Service (8080)
├── /db     → DB Service (8083)
│            ├── Mongo Service (8081)
│            ├── Postgres Service (8082)
│            └── Kafka Service (8084)
└── /kafka  → Kafka Service (8084)

Kafka Service (8084)
└── Produces to topics → Kafka Receivers (8085, 8086)
```

## Observability

All services are instrumented with OpenTelemetry and send:
- **Traces** → Tempo (via OTEL Collector)
- **Metrics** → Prometheus (via OTEL Collector)
- **Logs** → Loki (via OTEL Collector)

View in Grafana: http://localhost:3000

## Development Tips

1. **Check service health**: Each service logs "Listening for requests on..." when ready
2. **Debugging**: Uncomment `OTEL_LOG_LEVEL = 'debug'` in any `instrumentation.ts`
3. **Port conflicts**: Make sure ports 8080-8087 are available
4. **Database connections**: Services will fail if Postgres/MongoDB aren't running
5. **Kafka dependency**: Kafka consumers need Kafka broker running on port 9092
