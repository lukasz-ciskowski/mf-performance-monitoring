# C4 Model - Overview

Ten katalog zawiera kompletny model C4 (Context, Containers, Components, Code) dla systemu monitorowania mikrofrontendów.

## Struktura Dokumentacji

### 📄 [Level 1: System Context Diagram](./c4-level1-context.md)
Najwyższy poziom abstrakcji - pokazuje system jako całość i jego interakcje z użytkownikami oraz systemami zewnętrznymi.

**Zawiera:**
- Główne systemy (SPA React, SSR React, Backend Services, Data Layer, Monitoring Stack)
- Aktorzy (End User, DevOps Engineer, Developer)
- Zewnętrzne zależności
- Główne przepływy danych

**Idealny dla:** Executive stakeholders, Product Owners, Architects

---

### 📦 [Level 2: Container Diagram](./c4-level2-container.md)
Technologiczny widok systemu - pokazuje kontenery (aplikacje, bazy danych, serwisy) i ich komunikację.

**Zawiera:**
- Wszystkie kontenery z technologiami (React 18, Next.js 15, Node.js, Express)
- Porty i protokoły komunikacji
- Data stores (PostgreSQL, MongoDB, Kafka)
- Observability stack (OTEL Collector, Prometheus, Tempo, Loki, Grafana)
- Wzorce architektoniczne (BFF, Anti-corruption Layer, Event-driven)

**Idealny dla:** Solution Architects, DevOps Engineers, Tech Leads

---

### 🧩 [Level 3: Component Diagram](./c4-level3-component.md)
Wewnętrzna struktura kontenerów - pokazuje komponenty logiczne i ich odpowiedzialności.

**Zawiera 4 diagramy:**
1. **SPA React Components**: Router, Pages, Buttons, FrontendTracer, Web Vitals
2. **SSR React Components**: App Router, Server Components, Client Components, Suspense
3. **BFF Service Components**: Controllers, Middleware, Logger, Instrumentation
4. **DB Service Components**: Orchestration logic, Controllers, Instrumentation

**Idealny dla:** Software Engineers, Frontend/Backend Developers

---

### 💻 [Level 4: Code Diagram](./c4-level4-code.md)
Szczegóły implementacyjne - pokazuje klasy, metody i zależności na poziomie kodu.

**Zawiera 6 diagramów:**
1. **Frontend Tracer Class Diagram**: OpenTelemetry setup dla SPA
2. **SSR Instrumentation Class Diagram**: Server-side OTEL setup
3. **FileServiceButton Sequence**: Data flow dla komponentu
4. **SSR DbContent Flow**: Server-side rendering + client hydration
5. **BFF Controller Classes**: Implementation details
6. **DB Service Orchestration**: Flowchart logiki agregacji

**Plus kod snippets i design patterns**

**Idealny dla:** Developers implementujących features, Code Reviewers

---

## Jak Czytać Model C4?

### Od Góry do Dołu (Top-Down)
1. **Context** → Zrozum system jako całość
2. **Containers** → Zobacz technologie i deployment
3. **Components** → Poznaj wewnętrzną strukturę
4. **Code** → Zanurz się w implementację

### Od Dołu do Góry (Bottom-Up)
1. **Code** → Zrozum konkretną implementację
2. **Components** → Zobacz jak kod się organizuje
3. **Containers** → Poznaj deployment i technologie
4. **Context** → Zobacz szerszy kontekst biznesowy

### Dla Różnych Ról

| Rola | Poziomy | Cel |
|------|---------|-----|
| **Product Owner** | L1 | Zrozumienie wartości biznesowej |
| **Architect** | L1, L2 | Decyzje architektoniczne |
| **DevOps** | L2 | Deployment i monitoring |
| **Tech Lead** | L2, L3 | Design decisions |
| **Developer** | L3, L4 | Implementacja features |
| **QA** | L2, L3 | Test strategy |

---

## Kluczowe Koncepty w Systemie

### 🎯 Główne Wzorce

1. **Backend for Frontend (BFF)**
   - SSR React → BFF Service → Backend Services
   - Agregacja wywołań dla server-side rendering

2. **Anti-corruption Layer**
   - postgres-service i mongo-service izolują szczegóły baz danych
   - Umożliwia zmianę implementacji bez wpływu na konsumentów

3. **Event-driven Architecture**
   - Kafka dla asynchronicznej komunikacji
   - Producers (kafka-service) + Consumers (kafka-receiver-a/b)

4. **Observability Pattern**
   - Wszystkie serwisy → OTEL Collector → Storage Backends
   - Metryki (Prometheus) + Traces (Tempo) + Logs (Loki)

### 🔍 Monitoring & Telemetry

**Frontend:**
- SPA: OpenTelemetry Web SDK, własny FrontendTracer
- SSR: Server-side instrumentation w Next.js

**Backend:**
- Auto-instrumentation: Express, HTTP, Fetch, Database drivers
- Custom spans dla business logic
- Structured logging z severity levels

**Correlation:**
- W3C Trace Context propagation
- traceparent header przez wszystkie warstwy
- peer.service attribute dla identyfikacji targetów

### 📊 Data Flow Patterns

**Synchroniczne:**
```
User → Frontend → BFF → Service → Data Layer
```

**Asynchroniczne:**
```
Service → Kafka → Consumer → Processing
```

**Telemetry:**
```
All Services → OTEL Collector → [Prometheus|Tempo|Loki] → Grafana
```

---

## Technologie w Systemie

### Frontend
- **SPA**: React 18, Vite, TypeScript, TanStack Router
- **SSR**: Next.js 15, React 19, TypeScript, TanStack Query

### Backend
- **Runtime**: Node.js (LTS)
- **Framework**: Express.js
- **Language**: TypeScript
- **Instrumentation**: OpenTelemetry (auto + custom)

### Data Layer
- **SQL**: PostgreSQL 17
- **NoSQL**: MongoDB 8
- **Messaging**: Apache Kafka 3.8 + Zookeeper 3.9

### Observability
- **Collection**: OpenTelemetry Collector
- **Metrics**: Prometheus 3.0
- **Traces**: Grafana Tempo 2.6
- **Logs**: Grafana Loki 3.2
- **Visualization**: Grafana 11.3

### DevOps
- **Orchestration**: Docker Compose
- **Networking**: Docker bridge network
- **Storage**: Docker volumes (tmp/ directory)

---

## Quick Reference - Porty

| Serwis | Port | Opis |
|--------|------|------|
| spa-react | 3001 | SPA application |
| ssr-react | 3001 | SSR application (dev) |
| file-service | 8080 | File operations |
| mongo-service | 8081 | MongoDB access |
| postgres-service | 8082 | PostgreSQL access |
| db-service | 8083 | DB orchestrator |
| kafka-service | 8084 | Kafka producer |
| kafka-receiver-a | 8085 | Kafka consumer A |
| kafka-receiver-b | 8086 | Kafka consumer B |
| bff-service | 8087 | Backend for Frontend |
| Grafana | 3000 | Dashboards & Alerting |
| Loki | 3100 | Log aggregation |
| Tempo | 3200 | Distributed tracing |
| OTEL Collector | 4317/4318 | Telemetry (gRPC/HTTP) |
| PostgreSQL | 5432 | Database |
| Prometheus | 9090 | Metrics TSDB |
| MongoDB | 27017 | Database |
| Kafka | 9092 | Message broker |
| Zookeeper | 2181 | Kafka coordination |

---

## Powiązane Dokumenty

- [Architecture Diagrams](../documentation/architecture-diagrams.md) - Dodatkowe diagramy Mermaid
- [Availability Overview](../documentation/availability-overview.md) - SLI/SLO model
- [Metrics Inventory](../documentation/metrics-inventory.md) - Lista metryk
- [TODO](../documentation/todo.md) - Roadmap projektu

---

## Notacja C4

Model C4 używa spójnej notacji na wszystkich poziomach:

- **Prostokąty** = Systemy/Kontenery/Komponenty
- **Cylindry** = Bazy danych / Storage
- **Kolejki** = Message brokers
- **Strzałki** = Relacje i przepływ danych
- **Kolory** = Grupowanie logiczne (Frontend=niebieski, Backend=fioletowy, etc.)

---

**Autor:** Łukasz Ciskowski  
**Projekt:** Microfrontend Performance Monitoring (Magisterka)  
**Data utworzenia:** 9 listopada 2025  
**Wersja:** 1.0
