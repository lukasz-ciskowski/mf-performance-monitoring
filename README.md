# Model for Monitoring Microservices Integration in the Presentation Layer

_A Master Degree thesis_

# Frontend Performance Monitoring Model

This project demonstrates a frontend performance monitoring model within the context of a complex backend architecture.

## 📋 Prerequisites

To correctly reproduce the experiment, ensure you have:

- **Docker** & **Docker Compose**
- Minimum **4GB RAM** available (required to run all containers simultaneously)

## 🚀 Installation & Startup

The project consists of three separate `docker-compose` files. **You must launch them in the specific order listed below.**

> **Note:** Run each step in a **new, separate terminal session**, keeping the previous processes running.

### 1. Infrastructure

Start base services (databases, queues, monitoring):

```bash
docker compose -f docker-compose.infra.yaml up
```

Wait until all services are up, then leave this terminal running.

### 2. Backend services

In a **new terminal** (project root):

```bash
docker compose -f docker-compose.services.yaml up
```

### 3. Frontend

In another **new terminal** (project root):

```bash
docker compose -f docker-compose.front.yaml up
```

**Check:** Run `docker ps` — all containers from the three compose files should show status `Up`.

## Running the experiment

1. **Generate traffic:** Open http://localhost:3001 and use the app to trigger actions (buttons). This sends requests and collects performance metrics and traces.
2. **Inspect data:** Open Grafana at http://localhost:3000 (login: `admin` / `admin`). Use **Dashboards** to view the predefined experiment dashboards (metrics and traces).

## Troubleshooting

**Permission errors** (e.g. "access denied", "read-only file system", containers exiting): ensure `./tmp` is writable by Docker. From the project root:

```bash
chmod -R 777 ./tmp
```

Then restart infrastructure (Step 1).
