# Copilot Instructions – Microfrontend Monitoring Model Based on Backend Complexity

DO NOT CREATE DOCUMENTATION FILES UNLESS INSTRUCTED TO DO SO.

This file gives contextual guidance for the AI assistant while evolving the repository. It summarizes the architecture, thesis goals, key observability assumptions, and maps tasks from `todo.md` to expected artefacts.

---

## 1. Goal of the Thesis

Design and empirically validate a monitoring model for microfrontends where user-facing availability and experience quality are a function of: (a) backend structural complexity (number & type of dependencies, fan-out, depth of call chains), (b) health of infrastructural components, and (c) effectiveness of observability practices (metrics, traces, logs, alerting).

### Core Hypothesis

Better formalization of SLI/SLO combined with an explicit backend complexity index improves prediction & explanation of microfrontend availability degradations and shortens MTTR.

---

## 2. Architecture (summary)

-   Frontend: three microfrontends (`spa-react`, `mf-spa-react`, `mf-remote-ui`) – they call only: `file-service`, `db-service`.
-   Backend services: `file-service`, `db-service` (orchestrator), data access wrappers: `postgres-service`, `mongo-service`.
-   Messaging: `kafka-service`, consumers `kafka-receiver-a/b`.
-   Data stores: PostgreSQL, MongoDB, Kafka (Zookeeper).
-   Observability stack: OTEL Collector → Prometheus (metrics), Tempo (traces), Loki (logs), Grafana (dashboards & alerting).
-   Browser-side tracing planned (propagation of `traceparent`).

---

## 3. Fundamental Concepts to Enforce

1. SLI/SLO as a contract (not just descriptive metrics).
2. Microfrontend availability composition = function of critical service availability + partial degradation rules.
3. Backend Complexity Score influences: (a) alert priority, (b) weighting of services in MF availability, (c) burn-rate interpretation.
4. Distinguish liveness vs readiness; readiness gates inclusion of instances into SLI denominator.
5. Metric cardinality under control (allow-listed label sets).
6. Multi-window alerting + error budget burn (short & long windows).
7. UX ↔ backend correlation through traces & attributes `mf.name`, `user.journey.step`.

---

## 4. Infrastructure & System Structure

This section deepens the architectural context so the assistant can reason about operational constraints, reliability levers and where to embed instrumentation.

### 4.1 Layering & Responsibility Boundaries

-   Presentation Layer: Three microfrontends. Stateless, cacheable assets. Primary contract = stable API surface of `file-service` & `db-service`.
-   Orchestration / Business Layer: `db-service` (aggregates relational + document data) and `file-service` (file operations, optional event emission).
-   Data Access Layer (anti-corruption wrappers): `postgres-service`, `mongo-service` standardize DB connectivity, isolate driver / schema concerns, provide a chokepoint for query metrics & circuit breaking.
-   Messaging / Async Layer: `kafka-service` (producer / admin façade) + consumer workers (`kafka-receiver-a/b`) — isolates back-pressure, enables eventual consistency metrics.
-   Observability Layer: OTEL Collector centralizes ingestion; storage (Prometheus / Tempo / Loki) decoupled from producers, preventing telemetry back-pressure on business paths.

### 4.2 Deployment & Runtime Topology

-   Environment uses Docker Compose (single host orchestration) — implies shared network namespace (bridge) and static service discovery via container DNS names.
-   Vertical scaling only (no replica sets yet). Readiness gating is critical to avoid cold-start noise in SLI denominators.
-   Network tiers (logical):
    1. Edge / Browser (untrusted)
    2. Frontend containers (static content + tracing emitter)
    3. Service mesh substitute (direct container-to-container HTTP on bridge network)
    4. Data stores (stateful volumes under `tmp/`)
    5. Observability backends (stateful TSDB / trace / log stores)

### 4.3 Network & Port Allocation (Deterministic)

Fixed port map enables low-cardinality instrumentation targets and simpler blackbox probing. Collisions avoided; ephemeral ports not required for internal calls. Suggest adding a reserved range for future resilience components (e.g., circuit breaker dashboard, feature flag service) to maintain determinism.

### 4.4 Critical Synchronous Paths

1. MF → `db-service` → (`postgres-service` → PostgreSQL) + (`mongo-service` → MongoDB). Dual dependency means `db-service` availability is conjunctive if both queried within a request; partial fallback logic can reduce strict coupling (future enhancement).
2. MF → `file-service` (optionally emits event to Kafka). Upstream latency dominated by file I/O + serialization; Kafka publish is asynchronous (should not block response except on catastrophic broker timeout).

### 4.5 Asynchronous / Event Paths

-   `file-service` and `db-service` optionally produce to Kafka via `kafka-service` façade; consumers process downstream enrichment.
-   Degraded consumer health should not affect MF perceived availability; therefore consumer lag forms a resilience SLI, not a direct availability SLI for the frontend.
-   Freshness modelling: `data_freshness_seconds` = now() - event.processed_timestamp (captured in consumer span attribute) -> enables staleness alerts distinct from API error budget.

### 4.6 Observability Pipeline Deep Dive

| Stage           | Component                          | Purpose                                          | Potential Failure Impact            | Mitigation                                 |
| --------------- | ---------------------------------- | ------------------------------------------------ | ----------------------------------- | ------------------------------------------ |
| Instrumentation | OTEL SDK (auto + custom)           | Emit spans/metrics/logs                          | Local resource overhead             | Batch + sampling policies                  |
| Collection      | OTEL Collector receivers           | Normalize & buffer                               | Back-pressure → drop                | Memory limiter + retry/export queue        |
| Processing      | Attribute / Transform / Filter     | Enrich (service.version, mf.name) + reduce noise | Mis-config can drop critical labels | Config unit tests / golden config          |
| Export          | Prometheus / OTLP / Loki exporters | Persist to backends                              | Exporter failure hides signals      | Multi-backend separation (metrics vs logs) |
| Storage         | Prometheus TSDB / Tempo / Loki     | Query & retention                                | Disk saturation                     | Retention tiers, compaction tuning         |

-   Principle: Failure in any observability stage must not cascade to request latency (no synchronous blocking calls in hot paths).

### 4.7 Reliability & Resilience Primitives (Planned / Gaps)

-   Timeouts: Outer (API) < Inner (DB / Kafka) to prevent convoying.
-   Retries: Idempotent GET/READ only; backoff jitter.
-   Circuit Breakers: Candidate at `db-service` → `postgres-service` & `mongo-service` edges.
-   Bulkheads: Connection pool sizing (Postgres vs Mongo) to prevent cross-saturation.
-   Back-pressure: Kafka queue provides natural buffer; monitor lag growth derivative (d/dt lag).

### 4.8 Capacity & Performance Assumptions

-   Expected RPS (development scale) low, but design for burst scenario (×10) without cardinality explosion.
-   Histograms sized for latency quantiles up to multi-second tail without sparse buckets.
-   Single-node Prometheus acceptable; future scale path: remote-write or sharding if time-series > several million.

### 4.9 Risk Matrix (Condensed)

| Risk                  | Likely Cause          | User Impact          | Detection Signal                         | Mitigation                                |
| --------------------- | --------------------- | -------------------- | ---------------------------------------- | ----------------------------------------- |
| Hidden partial outage | One DB down, other up | Some MF flows fail   | Divergence in dependency error rates     | Degradation classification + fallback     |
| Telemetry blind spot  | Mis-labeled metrics   | Delayed MTTR         | Missing label in validation script       | CI metrics linter                         |
| Kafka backlog surge   | Consumer stall        | Data freshness drops | Lag slope (lag[t]-lag[t-5m]) > threshold | Auto scale consumer / throttled producers |
| Cardinality blow-up   | Dynamic label added   | Prometheus OOM       | Series churn & memory                    | Allow list enforcement                    |
| Slow query cascade    | N+1 or missing index  | Latency SLO burn     | p95 DB histogram shift pre API p95       | Query plan logging + caching              |

### 4.10 Security & Telemetry Boundaries

-   No PII in metric labels; potential PII kept only in logs with redaction.
-   Trace sampling adjustable (baseline probability + tail-based for high latency spans).
-   Isolation principle: Observability secrets (if added) never logged; config validated separately.

### 4.11 How Infrastructure Influences Measurement Strategy

-   Minimal replication means availability SLI is sensitive to single-container restarts → treat restart_rate as an early-warning indicator.
-   Conjunctive dependency chain for `db-service` justifies weighting or minimum composition for MF availability.
-   Asynchronous path decoupling legitimizes separate objectives: API Availability vs Data Freshness.

> Task mapping table has been moved to Appendix A to de-emphasize implementation checklists within the core conceptual guidance.

---

## Appendix A: Task Mapping (from `todo.md`) to Expected Artefacts

| ID  | Task                       | Artefacts / Files                                                  | Priority Notes                             |
| --- | -------------------------- | ------------------------------------------------------------------ | ------------------------------------------ |
| 1   | SLI/SLO Table              | `documentation/availability-overview.md` (sekcja SLI_SLO)          | Formuły + cele + error budget              |
| 2   | Error Budget Model         | Same file + spreadsheet (optional)                                 | Burn-rate formulas (5m vs 1h vs 6h vs 30d) |
| 3   | Availability Composition   | `documentation/availability-overview.md` + Mermaid diagram         | min / weighted / product function          |
| 4   | Metrics Inventory          | `documentation/metrics-inventory.md`                               | Full table                                 |
| 5   | Naming & Labels            | `documentation/metrics-guidelines.md`                              | Includes cardinality budget                |
| 6   | Health Endpoints           | Service code + `documentation/operational-readiness.md`            | /health/live & /health/ready patterns      |
| 7   | Backend Instrumentation    | `services/*/instrumentation.ts` files                              | Histogram boundaries                       |
| 8   | Frontend Tracing           | `apps/*` integration + `documentation/frontend-observability.md`   | Header propagation                         |
| 9   | Complexity Model           | `documentation/backend-complexity.md`                              | Formula + per-service scoring              |
| 10  | Resilience Metrics         | Instrumentation + inventory section                                | Circuit breaker if added                   |
| 11  | Lag & Freshness            | inventory + alert rules                                            | Kafka & data_freshness_seconds             |
| 12  | Alert Rules                | `instrumentation/prometheus/` or `documentation/alerting-rules.md` | PromQL + runbook link                      |
| 13  | Dashboards                 | `documentation/dashboards-spec.md`                                 | JSON exports optional                      |
| 14  | Retention & Sampling       | `documentation/telemetry-retention.md`                             | Policy + rationale                         |
| 15  | Telemetry Security         | `documentation/telemetry-security.md`                              | Masking / PII policy                       |
| 16  | Business Metrics           | inventory + `documentation/business-metrics.md`                    | KPI mapping                                |
| 17  | Runbooks                   | `documentation/runbooks/*.md`                                      | Each alert → runbook                       |
| 18  | Metrics Quality Validation | `scripts/validate-metrics.js` + doc                                | CI integration                             |
| 19  | Evaluation Methods         | `documentation/evaluation-methodology.md`                          | MTTD, MTTR definitions                     |
| 20  | Chaos Experiments          | `documentation/chaos-experiments.md`                               | Scenarios + expected signals               |
| 21  | Docs Update                | Updates per above                                                  | Iterative                                  |
| 22  | Diagram Updates            | `architecture-diagrams.md` (new sections)                          | Composition & complexity                   |
| 23  | CI Automation              | `.github/workflows/metrics-lint.yml` (example)                     | Lint + tests                               |
| 24  | Final Chapter              | `documentation/final-conclusions.md`                               | Synthetic conclusions                      |
| 25  | Copilot Instructions       | This document                                                      | Keep in sync with TODO                     |

---

## 5. Suggested Metric Conventions (Draft)

-   Naming: `<domain>_<resource>_<action|aspect>_<unit?>` (e.g. `http_request_duration_seconds`).
-   Domains: `http`, `db`, `kafka`, `service`, `resilience`, `business`, `frontend`.
-   Allowed label keys: `service`, `route`, `method`, `status_class`, `instance`, `version`, `environment`, `mf_name` (optional), `topic`, `partition`, `db_op`, `table`/`collection`.
-   Forbidden dynamic label values: full URL, trace_id, user_id, payload hash.
-   Cardinality budget: ≤ 200 label value combinations per metric; soft alert at > 150.

---

## 6. Proposed Histogram Boundaries (Initial)

| Area       | Histogram Name                           | Buckets (seconds)                                 |
| ---------- | ---------------------------------------- | ------------------------------------------------- |
| HTTP       | `http_request_duration_seconds`          | 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5        |
| DB         | `db_query_duration_seconds`              | 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.25, 0.5, 1 |
| Kafka Proc | `kafka_message_process_duration_seconds` | 0.005, 0.01, 0.02, 0.05, 0.1, 0.25, 0.5, 1, 2     |
| Frontend   | `frontend_action_duration_seconds`       | 0.05, 0.1, 0.25, 0.5, 1, 2, 4, 8                  |

---

## 7. Formula Drafts (to refine in Task #1)

-   Availability (service) = (successful_requests / total_requests) excluding maintenance + only readiness-passed instances.
-   Success Rate = (2xx + 3xx) / all HTTP (including 4xx).
-   Error Rate 5xx = 5xx / all.
-   Latency p95 = `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le,service))`.
-   Consumer Lag (avg) = `kafka_consumer_lag` (gauge) + p95 by topic.
-   Restart Rate = increase(`container_restart_count[1h]`).
-   CPU Saturation = container_cpu_usage_seconds_total / cpu_quota_seconds.
-   Apdex(T) = (Satisfied + Tolerating/2)/Total (proposed API T = 0.3s).

---

## 8. Complexity Score (Sketch)

Proposal:

```
Complexity(service) = w1*fan_out + w2*call_chain_depth + w3*async_ratio + w4*critical_dependencies
```

Use: modulate alert thresholds (e.g. relax latency SLO where inherently complex?) or triage priority weighting.

---

## 9. Alerting – Multi-window Pattern

Example (latency):

-   Warning: p95 > 250ms for 5m AND p95 > 220ms for 30m.
-   Critical: p95 > 300ms for 5m AND p95 > 270ms for 30m.  
    Error Budget Burn: short window (5m) / long (1h) > thresholds 14 / 2.

---

## 10. Guidance for Code / Config Generation

1. Always reference the allowed label key list.
2. Never add `trace_id` as a metric label; keep it in logs or span attributes.
3. For new histograms, apply bucket boundaries from section 6.
4. For PromQL alert rules include a comment with the SLO target & runbook link placeholder.
5. When editing docs keep `availability-overview.md` and this file consistent if conventions change.
6. Avoid ad-hoc / throwaway metrics – stick to the inventory.
7. Health readiness must test critical deps (PostgreSQL, MongoDB, Kafka metadata) with a timeout.

---

## 11. Success Criteria for the Complete Model

-   100% of `todo.md` tasks completed.
-   SLO attainment reported for at least one simulated or real 30‑day window.
-   Every alert has a runbook and a chaos test that triggers it.
-   Complexity score computed & interpreted for all services.
-   Dashboards cover: Executive, Service drill-down, Dependencies, Kafka, DB, Resilience, Frontend↔Backend.

---

## 12. When to Update This File

Update after:

-   Adding new metrics / changing naming guidelines.
-   Finalizing SLO targets (revise sections 7 & 8).
-   Implementing complexity score (add actual weights & values).

---

## 13. Roadmap (Priority Outline)

1. SLI/SLO + Inventory + Naming.
2. Backend instrumentation + health.
3. Alerting + Runbooks + Dashboards.
4. Complexity model + Chaos experiments.
5. Evaluation & final conclusions.

---

_Revision: v0.1 (initial – translated to English)._
