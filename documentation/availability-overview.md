# Przegląd Dostępności Usług i Środowiska

Dokument podsumowuje aktualny stan **dostępności mikroserwisów**, **środowiska uruchomieniowego** oraz **zaplanowanych kategorii metryk** w projekcie. Zawiera też identyfikację braków wymaganych do pełnego modelu monitorowania opartego na złożoności backendu.

---
## 1. Aktualna struktura Usług
| Warstwa | Komponent | Port / Rola | Typ komunikacji | Krytyczność (wstępna) | Uwagi |
|---------|-----------|------------|-----------------|-----------------------|-------|
| Frontend (MF) | spa-react | 3001 | HTTP → API | Medium | Kontener single-spa host |
| Frontend (MF) | mf-spa-react | 3002 | HTTP → API | Medium | Host Module Federation |
| Frontend (MF) | mf-remote-ui | 3003 | HTTP → API | Medium | Remote module |
| Business Service | file-service | 8080 | HTTP sync | High | Punkt styku dla operacji plikowych |
| Business Service | db-service | 8083 | HTTP sync + async (Kafka) | High | Orkiestruje dostęp do danych (Postgres + Mongo) |
| Data Service | postgres-service | 8082 | HTTP / internal | High | Warstwa pośrednia do PostgreSQL |
| Data Service | mongo-service | 8081 | HTTP / internal | High | Warstwa pośrednia do MongoDB |
| Messaging | kafka-service | 8084 | HTTP → Kafka broker | Medium | Producent / kontrola przepływu |
| Messaging | kafka-receiver-a | 8085 | Async consumer | Low/Medium | Konsument A |
| Messaging | kafka-receiver-b | 8086 | Async consumer | Low/Medium | Konsument B |
| Data Layer | PostgreSQL | 5432 | TCP | High | Persystencja relacyjna |
| Data Layer | MongoDB | 27017 | TCP | High | Persystencja dokumentowa |
| Data Layer | Kafka | 9092 | TCP | High | Kolejka zdarzeń |
| Control | Zookeeper | 2181 | TCP | Medium | Koordynacja Kafki |
| Observability | OTEL Collector | 4317 | OTLP gRPC | High (monitoring) | Agregacja telemetryczna |
| Observability | Prometheus | 9090 | Pull / HTTP | High (monitoring) | Metryki |
| Observability | Tempo | 3200 | Traces | High (monitoring) | Ślady |
| Observability | Loki | 3100 | Logs | High (monitoring) | Logi |
| Observability | Grafana | 3000 | UI | High (monitoring) | Wizualizacja / alerty |

---
## 2. Model Zależności Dostępności (Implicit)
- Mikrofrontendy zależą wyłącznie od `file-service` i `db-service` (redukcja powierzchni awarii w UI).
- `db-service` zależy od: `postgres-service` → PostgreSQL oraz `mongo-service` → MongoDB.
- `file-service` oraz `db-service` mogą opcjonalnie publikować do `kafka-service` → Kafka (ścieżka asynchroniczna – brak blokady dla żądań synchronicznych przy awarii konsumentów).
- Telemetria out-of-band (Collector, Prometheus, Tempo, Loki) — brak wpływu awarii monitoringu na ścieżkę użytkownika (poza widocznością zdarzeń).

### Wnioskowana kompozycja dostępności
Przykład (bez formalizacji):
```
Availability(db-service) ≈ Availability(postgres-service) * Availability(mongo-service)
Availability(microfrontend) ≈ f(Availability(file-service), Availability(db-service))
```
Gdzie w przyszłości `f` może być: min(), ważona średnia lub probabilistyczny iloczyn zależności krytycznych.

---
## 3. Środowisko Uruchomieniowe
- Konteneryzacja (Docker Compose) – izolacja usług + spójny provisioning.
- Oddzielone kanały telemetryczne: Metrics (Prometheus), Traces (Tempo), Logs (Loki).
- OTEL Collector z procesorami (batch, attribute, transform, filter, memory limiter) — możliwość wzbogacania i kontroli przepływu.
- Brak obecnie zdefiniowanych polityk: retention, sampling, resource limits (w dokumentacji).
- Scalony przepływ: Instrumentation → Collection → Processing → Export → Storage → Grafana (dashboardy / alerting).

---
## 4. Kategorie Metryk Już Zidentyfikowane
| Kategoria | Elementy (z diagramów) | Cel |
|----------|------------------------|-----|
| Dostępność API | Health Checks, HTTP Status, Response Time, Throughput | Obliczanie SLI dostępności i latency |
| Infrastruktura | Container Metrics, Resource Utilization, Network, Storage | Saturation & capacity planning |
| Aplikacja | Distributed Tracing, Error Tracking, Performance Profiling, Business Metrics | Debug, korelacja przyczyn opóźnień |
| UX (MF) | Page Load, TTI, Core Web Vitals, User Journey | Powiązanie percepcji użytkownika z backendem |
| Zależności | Database Performance, Message Queue Lag, External API Latency (placeholder) | Wpływ łańcucha zależności |
| SLA/SLO | Availability 99.9%, Latency P95 < 200ms, Error Budget, MTTR/MTBF | Kontrakt jakościowy |

---
## 5. Co Już Masz (Expressis Verbis lub Implicit)
- Kompletna mapa usług i przepływów (synchroniczne/asynchroniczne).
- Pipeline telemetrii (metrics / traces / logs) z komponentami storage.
- Wstępne progi docelowe: Availability (99.9%), P95 latency (<200ms).
- Model stanu alertów (Normal → Warning → Critical → Incident) z krokami eskalacji.
- Hierarchia metryk wydajności (infrastruktura → aplikacja → UX → dependencies → SLA/SLO).
- Korelacja front–backend przez planowane ślady (Frontend Tracer w Single-SPA i Module Federation).

---
## 6. Zidentyfikowane Luki
| Obszar | Brakujący element | Priorytet |
|--------|-------------------|-----------|
| SLI/SLO | Formalne formuły (Success Rate, Latency p95/p99, Error Rate, Consumer Lag, Restart Rate) + budżet błędów | Wysoki |
| Metryki | Tabelaryczna lista: nazwa, typ, etykiety dozwolone, źródło (auto/custom) | Wysoki |
| Health | Rozdzielenie `liveness` / `readiness` + definicja kryteriów OK | Wysoki |
| Kompozycja | Formalna funkcja Availability_MF (ważenie zależności) | Wysoki |
| Alerting | PromQL: burn rate, latency multi-window, error rate, lag | Wysoki |
| Złożoność | Metryki fan-out, depth, async_ratio → wpływ na priorytety | Średni |
| Resilience | Circuit breaker / retry / timeout metryki (cb_state, retry_total, timeout_ratio) | Średni |
| Retencja | Polityka retention + downsampling + trace sampling rate | Średni |
| Naming | Konwencja + budżet cardinality + zakazane dynamiczne label values | Wysoki |
| Runbook | Linkowanie alert → instrukcja reagowania | Średni |
| Biznes | Konkrety (np. file_uploaded_success_total) | Średni |
| Bezpieczeństwo | Masking PII w logach / sampling selektywny | Niższy (ale istotny) |

---
## 7. Rekomendowane Następne Kroki
1. Utworzyć tabelę SLI/SLO (Availability, Latency p95, Error Rate, Consumer Lag, Restart Rate). 
2. Zdefiniować listę metryk (prefiks domenowy, typ, etykiety: service, route, method, status_class, instance, version, environment, mf_name – tylko gdy potrzebne). 
3. Wprowadzić health endpoints: `/health/live` (proces) i `/health/ready` (zależności). 
4. Opracować funkcję kompozycji dostępności MF (np. min + degradacja częściowa gdy tylko jedna ścieżka funkcjonalna). 
5. Dodać reguły alertów (multi-window + burn rate). 
6. Zaprojektować metryki złożoności (np. `service_dependency_fanout`, `service_call_chain_depth`). 
7. Zdefiniować politykę retencji i sampling (np. traces: 20% base + tail sampling na p95 > threshold). 
8. Dodać naming guidelines + linter / checklist. 
9. Wprowadzić podstawowe metryki biznesowe (np. `file_upload_total{status="success|error"}`). 
10. Mapować alerty do runbooków (annotation label `runbook_url`).

---
## 8. Podsumowanie
Masz solidne fundamenty architektury obserwowalności: pełne warstwy, przepływ danych i mapę zależności. Kluczowy brak to **kontraktowy aspekt dostępności** (formalne SLI/SLO, formuły kompozycji i szczegółowe metryki). Po uzupełnieniu listy metryk, definicji SLI oraz reguł alertów z burn-rate otrzymasz spójny model monitorowania powiązany z realną percepcją dostępności mikrofrontendów.

---
_Dokument wersja: 0.1 – automatycznie wygenerowany szkic. Kolejna wersja powinna dodać tabelę SLI/SLO i definicje metryk._
