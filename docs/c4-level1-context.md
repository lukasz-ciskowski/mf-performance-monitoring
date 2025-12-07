# C4 Model - Level 1: System Context Diagram

## Przegląd

Diagram kontekstu systemowego przedstawia system monitorowania mikrofrontendów na najwyższym poziomie abstrakcji. Pokazuje główne komponenty systemowe i ich interakcje z użytkownikami oraz systemami zewnętrznymi.

## Diagram

```mermaid
C4Context
    title System Context Diagram - Microfrontend Monitoring System

    Person(user, "End User", "Osoba korzystająca z aplikacji webowych")
    Person(devops, "DevOps Engineer", "Zarządza infrastrukturą i monitoringiem")
    Person(developer, "Developer", "Tworzy i utrzymuje mikroserwisy")

    System_Boundary(mf_system, "Microfrontend System") {
        System(spa_app, "SPA React App", "Aplikacja Single Page Application z własnym tracingiem")
        System(ssr_app, "SSR React App", "Aplikacja Next.js z renderowaniem po stronie serwera")
    }

    System_Boundary(backend_system, "Backend Services") {
        System(bff, "BFF Service", "Backend for Frontend - agreguje wywołania do serwisów")
        System(file_svc, "File Service", "Zarządza operacjami na plikach")
        System(db_svc, "DB Service", "Orkiestruje dostęp do baz danych")
        System(kafka_svc, "Kafka Service", "Zarządza komunikacją asynchroniczną")
    }

    System_Boundary(data_system, "Data Layer") {
        SystemDb(postgres, "PostgreSQL", "Relacyjna baza danych")
        SystemDb(mongo, "MongoDB", "Dokumentowa baza danych")
        SystemQueue(kafka, "Apache Kafka", "System kolejkowania wiadomości")
    }

    System_Boundary(monitoring_system, "Monitoring & Observability") {
        System(otel, "OTEL Collector", "Centralny punkt zbierania telemetrii")
        System(prometheus, "Prometheus", "Przechowywanie i zapytania metryk")
        System(tempo, "Tempo", "Przechowywanie distributed traces")
        System(loki, "Loki", "Agregacja i analiza logów")
        System(grafana, "Grafana", "Wizualizacja i alerting")
    }

    Rel(user, spa_app, "Używa", "HTTPS")
    Rel(user, ssr_app, "Używa", "HTTPS")
    
    Rel(spa_app, file_svc, "Wywołuje API", "HTTP/REST")
    Rel(spa_app, db_svc, "Wywołuje API", "HTTP/REST")
    
    Rel(ssr_app, bff, "Wywołuje API", "HTTP/REST")
    Rel(bff, file_svc, "Wywołuje", "HTTP/REST")
    Rel(bff, db_svc, "Wywołuje", "HTTP/REST")
    Rel(bff, kafka_svc, "Wywołuje", "HTTP/REST")
    
    Rel(db_svc, postgres, "Odczyt/zapis", "SQL")
    Rel(db_svc, mongo, "Odczyt/zapis", "MongoDB Protocol")
    Rel(kafka_svc, kafka, "Publikuje/konsumuje", "Kafka Protocol")
    
    Rel(spa_app, otel, "Wysyła telemetrię", "OTLP")
    Rel(ssr_app, otel, "Wysyła telemetrię", "OTLP")
    Rel(bff, otel, "Wysyła telemetrię", "OTLP")
    Rel(file_svc, otel, "Wysyła telemetrię", "OTLP")
    Rel(db_svc, otel, "Wysyła telemetrię", "OTLP")
    Rel(kafka_svc, otel, "Wysyła telemetrię", "OTLP")
    
    Rel(otel, prometheus, "Eksportuje metryki", "Remote Write")
    Rel(otel, tempo, "Eksportuje traces", "OTLP")
    Rel(otel, loki, "Eksportuje logi", "HTTP")
    
    Rel(grafana, prometheus, "Zapytania", "PromQL")
    Rel(grafana, tempo, "Zapytania", "HTTP")
    Rel(grafana, loki, "Zapytania", "LogQL")
    
    Rel(devops, grafana, "Monitoruje system", "HTTPS")
    Rel(developer, grafana, "Analizuje metryki", "HTTPS")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="2")
```

## Główne Komponenty

### Użytkownicy

- **End User** - Końcowy użytkownik korzystający z aplikacji webowych (SPA i SSR)
- **DevOps Engineer** - Odpowiedzialny za infrastrukturę, monitoring i alerty
- **Developer** - Rozwija i utrzymuje mikroserwisy, analizuje metryki wydajności

### Systemy Frontendowe

- **SPA React App** - Aplikacja Single Page Application z własną instrumentacją OpenTelemetry
- **SSR React App** - Aplikacja Next.js z renderowaniem po stronie serwera, korzysta z BFF

### Backend Services

- **BFF Service** - Backend for Frontend, agreguje wywołania dla SSR App
- **File Service** - Zarządza operacjami na plikach
- **DB Service** - Orkiestruje dostęp do wielu baz danych (Postgres + Mongo)
- **Kafka Service** - Zarządza komunikacją asynchroniczną przez Kafka

### Data Layer

- **PostgreSQL** - Relacyjna baza danych
- **MongoDB** - Dokumentowa baza danych
- **Apache Kafka** - System kolejkowania wiadomości dla komunikacji asynchronicznej

### Monitoring & Observability

- **OTEL Collector** - Centralny punkt zbierania telemetrii (metryki, traces, logi)
- **Prometheus** - Time-series database dla metryk
- **Tempo** - Backend dla distributed tracing
- **Loki** - System agregacji logów
- **Grafana** - Platforma wizualizacji i alertingu

## Kluczowe Przepływy

1. **User Journey Flow**:
   - Użytkownik → SPA/SSR App → Backend Services → Data Layer

2. **Telemetry Flow**:
   - Wszystkie komponenty → OTEL Collector → Storage Backends → Grafana

3. **Monitoring Flow**:
   - DevOps/Developer → Grafana → Backends (Prometheus/Tempo/Loki)

## Główne Cele Systemu

1. **Dostępność** - Monitorowanie dostępności mikrofrontendów i serwisów backendowych
2. **Wydajność** - Śledzenie czasu odpowiedzi, przepustowości i wykorzystania zasobów
3. **Observability** - Pełna widoczność przez metryki, traces i logi
4. **Alerting** - Proaktywne powiadamianie o problemach i degradacji wydajności
5. **Correlation** - Korelacja metryk frontendowych z wydajnością backendu

## Zewnętrzne Zależności

System nie posiada bezpośrednich zależności od zewnętrznych systemów trzecich. Wszystkie komponenty działają w izolowanym środowisku Docker Compose.
