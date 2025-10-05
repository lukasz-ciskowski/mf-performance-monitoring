# TODO – Model Monitorowania Mikrofrontendów oparty na złożoności backendu

Dokument zbiera wszystkie działania niezbędne do pełnego zaprojektowania, implementacji oraz ewaluacji modelu monitorowania.

## Legenda statusów
- [ ] nie rozpoczęto
- [-] w toku / częściowo
- [x] ukończone

---
## Faza 1: Kontrakt Dostępności (SLI/SLO)
- [-] Definicja tabeli SLI/SLO  
  Zdefiniować SLI: Availability, Success Rate, Latency p50/p95/p99, Error Rate (4xx/5xx oddzielnie), Consumer Lag, Restart Rate, Saturation (CPU/Mem/ConnPool), Apdex. Dla każdej: formuła, typ (ratio, histogram), cel SLO, budżet błędów.
- [ ] Model budżetu błędów  
  Wyliczyć miesięczny/tygodniowy budżet błędów dla SLO (np. 99.9%, 99.5%) + reguły burn rate (okna 5m/1h/6h/30d).
- [ ] Kompozycja dostępności MF  
  Sformalizować funkcję Availability_MF = f(Availability usług krytycznych). Min vs ważone vs probabilistyczne (prod). Zdefiniować degradację częściową.
- [ ] Health liveness/readiness  
  Zaprojektować i opisać /health/live (proces) i /health/ready (deps: DB ping, Kafka metadata). Określić wpływ na SLI.

## Faza 2: Instrumentacja i Metryki
- [ ] Inwentarz metryk  
  Tabela: nazwa, opis, typ (counter/gauge/histogram), etykiety dozwolone, źródło (auto/custom), okna agregacji, częstotliwość scrapowania.
- [ ] Konwencje nazw i etykiet  
  Prefiks domenowy, snake_case, dozwolone label sets (service, route, method, status_class, instance, version, environment, mf_name opcjonalnie). Limity cardinality + zakazane dynamiczne wartości.
- [ ] Instrumentacja backend HTTP/DB/Kafka  
  Custom histogram boundaries, db_query_duration, kafka_consumer_lag, kafka_messages_processed, span attributes.
- [ ] Instrumentacja frontend tracing  
  Propagacja traceparent, atrybuty mf.name, user.journey.step, korelacja z backend spans.
- [ ] Metryki odporności  
  timeout_total, timeout_ratio, retry_total, retry_success_ratio, cb_state, cb_open_total, bulkhead_rejected_total.
- [ ] Lag i świeżość danych  
  kafka_consumer_lag, data_freshness_seconds, progi alertów.
- [ ] Metryki biznesowe  
  file_upload_total{status}, business_event_total, KPI korelowane z SLI.

## Faza 3: Model Złożoności i Wpływ
- [ ] Model złożoności backendu  
  Wskaźniki: fan_out, call_chain_depth, async_ratio, critical_dependency_count. Scoring + przykład per service.
- [ ] Powiązanie complexity score z priorytetem alertów i budżetem błędów.

## Faza 4: Alerting i Reakcja
- [ ] Reguły alertów PromQL  
  Latency multi-window, error rate, availability, burn rate, saturation, consumer lag, restart storms.
- [ ] Runbooki i mapowanie alertów  
  Wzorzec runbook + annotation runbook_url.
- [ ] Metryki ewaluacji procesu  
  MTTD, MTTA, MTTR, SLO attainment %, coverage journeys %, pre/post improvements.

## Faza 5: Operacje i Retencja
- [ ] Retencja i sampling  
  Metrics (raw 15d, downsample 90d), traces (base 20% + tail sampling), logs (30d).
- [ ] Polityka bezpieczeństwa telemetrycznego  
  Masking PII, wykluczenia pól, selective sampling.
- [ ] Walidacja jakości metryk  
  Testy integracyjne, lint nazewnictwa, kontrola cardinality.
- [ ] Automatyzacja w CI  
  Skrypt/linter nazw metryk, test health endpoints.

## Faza 6: Eksperymenty i Wnioski
- [ ] Eksperymenty chaos/fault injection  
  Scenariusze: DB down, Kafka lag, partial dependency. Pomiar czasu detekcji.
- [ ] Analiza wyników eksperymentów vs SLO  
  Czy metryki i alerty zadziałały wg założeń.
- [ ] Rozdział końcowy i wnioski  
  Wpływ złożoności backendu na dostępność MF, ograniczenia, rekomendacje.

## Faza 7: Dokumentacja i Wizualizacja
- [ ] Aktualizacja dokumentacji  
  Uzupełnić `availability-overview.md` (SLI/SLO, metryki, alerty, kompozycja, complexity score).
- [ ] Aktualizacja diagramów  
  Diagram kompozycji dostępności, scoring złożoności, adnotacje SLO.
- [ ] Dashboardy  
  Executive SLO, Service drill-down, Dependency, Kafka, DB, Resilience, Frontend↔Backend overlay.

---
## Notatki Dodatkowe
- Priorytet Faza 1 i 2 – bez nich brak podstaw do ewaluacji.
- Complexity score może wpływać na wagę usług w Availability_MF.
- Burn rate: dwa okna (krótkie + długie) pozwalają redukować flapping.

_Dokument generowany: v0.1 – aktualizuj statusy podczas realizacji._
