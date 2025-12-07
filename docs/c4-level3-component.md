# C4 Model - Level 3: Component Diagram

## Przegląd

Diagram komponentów przedstawia wewnętrzną strukturę wybranych kontenerów, pokazując główne komponenty logiczne i ich odpowiedzialności.

## Diagram 1: SPA React App - Components

```mermaid
C4Component
    title Component Diagram - SPA React Application

    Container_Boundary(spa_boundary, "SPA React App") {
        Component(router, "TanStack Router", "React Router", "Zarządza routing i nawigacją client-side")
        Component(root_route, "Root Route", "React Component", "Główny layout aplikacji z Outlet dla podstron")
        
        Component(index_page, "Index Page", "React Component", "Strona główna z linkami nawigacyjnymi")
        Component(file_page, "File Page", "React Component", "Strona z operacjami na plikach")
        Component(db_page, "DB Page", "React Component", "Strona z operacjami na bazach danych")
        Component(kafka_page, "Kafka Page", "React Component", "Strona z operacjami Kafka")
        
        Component(file_button, "FileServiceButton", "React Component", "Komponent wywołujący file-service API")
        Component(db_button, "DbServiceButton", "React Component", "Komponent wywołujący db-service API")
        
        Component(error_boundary, "ErrorBoundary", "React Component", "Obsługa błędów renderowania")
        
        Component(frontend_tracer, "FrontendTracer", "OpenTelemetry", "Klasa zarządzająca tracingiem po stronie przeglądarki")
        Component(web_vitals, "Web Vitals Metrics", "Web Vitals", "Zbiera metryki wydajnościowe (LCP, FID, CLS)")
        
        Component(main, "Main Entry", "TypeScript", "Punkt wejścia aplikacji, inicjalizacja OTEL")
    }

    Container_Ext(file_service, "File Service", "Node.js, Express", "API dla operacji na plikach")
    Container_Ext(db_service, "DB Service", "Node.js, Express", "API dla operacji na bazach danych")
    Container_Ext(otel_collector, "OTEL Collector", "OpenTelemetry", "Zbieranie telemetrii")

    Rel(main, router, "Inicjalizuje")
    Rel(main, frontend_tracer, "Konfiguruje")
    Rel(main, web_vitals, "Rejestruje")
    
    Rel(router, root_route, "Renderuje")
    Rel(root_route, index_page, "Route: /")
    Rel(root_route, file_page, "Route: /file")
    Rel(root_route, db_page, "Route: /db")
    Rel(root_route, kafka_page, "Route: /kafka")
    
    Rel(file_page, file_button, "Zawiera")
    Rel(db_page, db_button, "Zawiera")
    
    Rel(file_button, file_service, "fetch('/file-service/file')", "HTTP")
    Rel(db_button, db_service, "fetch('/db-service/db')", "HTTP")
    
    Rel(root_route, error_boundary, "Opakowuje")
    
    Rel(file_button, frontend_tracer, "Tworzy span")
    Rel(db_button, frontend_tracer, "Tworzy span")
    Rel(web_vitals, frontend_tracer, "Rejestruje metryki")
    
    Rel(frontend_tracer, otel_collector, "Wysyła telemetrię", "OTLP/HTTP")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

## Diagram 2: SSR React App (Next.js) - Components

```mermaid
C4Component
    title Component Diagram - SSR React Application (Next.js)

    Container_Boundary(ssr_boundary, "SSR React App") {
        Component(app_router, "App Router", "Next.js 15", "Routing z App Directory pattern")
        Component(root_layout, "Root Layout", "React Server Component", "Główny layout z Providers")
        Component(providers, "Providers", "Client Component", "QueryClientProvider dla React Query")
        
        Component(index_page, "Home Page", "React Server Component", "Strona główna z nawigacją")
        
        Component(file_page, "File Page", "React Server Component", "Server-side fetch + hydration")
        Component(file_content, "FileContent", "Client Component", "Suspense + useSuspenseQuery")
        Component(file_display, "FileDataDisplay", "Client Component", "Wyświetlanie danych z możliwością refetch")
        
        Component(db_page, "DB Page", "React Server Component", "Server-side fetch + hydration")
        Component(db_content, "DbContent", "Client Component", "Suspense + useSuspenseQuery")
        Component(db_display, "DbDataDisplay", "Client Component", "Wyświetlanie danych z możliwością refetch")
        
        Component(kafka_page, "Kafka Page", "React Server Component", "Server-side fetch + hydration")
        Component(kafka_content, "KafkaContent", "Client Component", "Suspense + useSuspenseQuery")
        Component(kafka_display, "KafkaDataDisplay", "Client Component", "Wyświetlanie danych z możliwością refetch")
        
        Component(instrumentation, "Instrumentation", "Node.js", "Server-side OTEL setup (registers on startup)")
        Component(globals_css, "Global Styles", "Tailwind CSS", "Styling dla całej aplikacji")
    }

    Container_Ext(bff_service, "BFF Service", "Node.js, Express", "Backend for Frontend API")
    Container_Ext(otel_collector, "OTEL Collector", "OpenTelemetry", "Zbieranie telemetrii")

    Rel(app_router, root_layout, "Renderuje")
    Rel(root_layout, providers, "Opakowuje children")
    Rel(root_layout, globals_css, "Importuje")
    
    Rel(app_router, index_page, "Route: /")
    Rel(app_router, file_page, "Route: /file")
    Rel(app_router, db_page, "Route: /db")
    Rel(app_router, kafka_page, "Route: /kafka")
    
    Rel(file_page, bff_service, "Server fetch: /file", "HTTP")
    Rel(file_page, file_content, "Przekazuje initialData")
    Rel(file_content, file_display, "Suspense wrapper")
    Rel(file_display, bff_service, "Client refetch: /file", "HTTP")
    
    Rel(db_page, bff_service, "Server fetch: /db", "HTTP")
    Rel(db_page, db_content, "Przekazuje initialData")
    Rel(db_content, db_display, "Suspense wrapper")
    Rel(db_display, bff_service, "Client refetch: /db", "HTTP")
    
    Rel(kafka_page, bff_service, "Server fetch: /kafka", "HTTP")
    Rel(kafka_page, kafka_content, "Przekazuje initialData")
    Rel(kafka_content, kafka_display, "Suspense wrapper")
    Rel(kafka_display, bff_service, "Client refetch: /kafka", "HTTP")
    
    Rel(instrumentation, otel_collector, "Server-side telemetry", "OTLP/gRPC")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

## Diagram 3: BFF Service - Components

```mermaid
C4Component
    title Component Diagram - BFF Service

    Container_Boundary(bff_boundary, "BFF Service") {
        Component(express_app, "Express App", "Express.js", "HTTP server")
        Component(cors_middleware, "CORS Middleware", "cors", "Obsługa CORS dla cross-origin requests")
        
        Component(file_controller, "File Controller", "Express Route Handler", "GET /file - proxy do file-service")
        Component(db_controller, "DB Controller", "Express Route Handler", "GET /db - proxy do db-service")
        Component(kafka_controller, "Kafka Controller", "Express Route Handler", "GET /kafka - proxy do kafka-service")
        
        Component(logger, "Logger", "OpenTelemetry Logs API", "Strukturalne logowanie z severity levels")
        Component(instrumentation, "Instrumentation", "OpenTelemetry SDK", "Auto-instrumentation dla Express + fetch")
    }

    Container_Ext(file_service, "File Service", "Node.js, Express", "Operacje na plikach")
    Container_Ext(db_service, "DB Service", "Node.js, Express", "Agregacja baz danych")
    Container_Ext(kafka_service, "Kafka Service", "Node.js, Express", "Kafka producer")
    Container_Ext(otel_collector, "OTEL Collector", "OpenTelemetry", "Zbieranie telemetrii")

    Rel(express_app, cors_middleware, "Używa")
    Rel(express_app, file_controller, "Route: GET /file")
    Rel(express_app, db_controller, "Route: GET /db")
    Rel(express_app, kafka_controller, "Route: GET /kafka")
    
    Rel(file_controller, logger, "Loguje operacje")
    Rel(db_controller, logger, "Loguje operacje")
    Rel(kafka_controller, logger, "Loguje operacje")
    
    Rel(file_controller, file_service, "fetch(FILE_SERVICE_URL/file)", "HTTP")
    Rel(db_controller, db_service, "fetch(DB_SERVICE_URL/db)", "HTTP")
    Rel(kafka_controller, kafka_service, "fetch(KAFKA_SERVICE_URL/kafka)", "HTTP")
    
    Rel(instrumentation, express_app, "Auto-instrumentuje")
    Rel(instrumentation, otel_collector, "Wysyła telemetrię", "OTLP/gRPC")
    Rel(logger, otel_collector, "Wysyła logi", "OTLP")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

## Diagram 4: DB Service - Components

```mermaid
C4Component
    title Component Diagram - DB Service

    Container_Boundary(db_boundary, "DB Service") {
        Component(express_app, "Express App", "Express.js", "HTTP server")
        Component(cors_middleware, "CORS Middleware", "cors", "CORS support")
        
        Component(db_controller, "DB Controller", "Express Route Handler", "GET /db - orkiestruje wywołania do postgres + mongo")
        
        Component(logger, "Logger", "OpenTelemetry Logs API", "Strukturalne logowanie")
        Component(instrumentation, "Instrumentation", "OpenTelemetry SDK", "Auto-instrumentation")
    }

    Container_Ext(postgres_service, "Postgres Service", "Node.js, Express", "PostgreSQL access layer")
    Container_Ext(mongo_service, "Mongo Service", "Node.js, Express", "MongoDB access layer")
    Container_Ext(otel_collector, "OTEL Collector", "OpenTelemetry", "Zbieranie telemetrii")

    Rel(express_app, cors_middleware, "Używa")
    Rel(express_app, db_controller, "Route: GET /db")
    
    Rel(db_controller, logger, "Loguje start/end operacji")
    Rel(db_controller, postgres_service, "fetch(POSTGRES_SERVICE_URL/postgres)", "HTTP")
    Rel(db_controller, mongo_service, "fetch(MONGO_SERVICE_URL/mongo)", "HTTP")
    
    Rel(instrumentation, express_app, "Auto-instrumentuje")
    Rel(instrumentation, otel_collector, "Wysyła telemetrię", "OTLP/gRPC")
    Rel(logger, otel_collector, "Wysyła logi", "OTLP")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

## Kluczowe Komponenty i Odpowiedzialności

### SPA React App

#### Routing & Navigation
- **TanStack Router**: File-based routing, type-safe routes
- **Root Route**: Layout wrapper z `<Outlet />` dla renderowania podstron
- **Pages**: Komponenty stron dla każdej ścieżki (/, /file, /db, /kafka)

#### Business Components
- **FileServiceButton**: Wywołuje API file-service, wyświetla response
- **DbServiceButton**: Wywołuje API db-service, wyświetla response
- **ErrorBoundary**: Łapie błędy renderowania React

#### Observability
- **FrontendTracer**: Klasa inicjalizująca OTEL Web SDK
  - Konfiguruje TracerProvider z WebTracerProvider
  - Rejestruje instrumentation (DocumentLoad, XMLHttpRequest, Fetch)
  - Eksportuje spany do OTEL Collector przez OTLP/HTTP
  - Propaguje `traceparent` header w requestach
- **Web Vitals Metrics**: Zbiera CWV (LCP, FID, CLS, FCP, TTFB)

### SSR React App (Next.js)

#### App Router Architecture
- **App Router**: Next.js 15 routing z App Directory
- **Root Layout**: Server Component z Providers i global styles
- **Providers**: Client Component wrapper dla QueryClientProvider

#### Page Architecture (per route)
1. **Server Component (Page)**: 
   - Wykonuje server-side fetch do BFF
   - Przekazuje initialData do Client Component
   - Umożliwia SSR + SEO
2. **Client Component (Content)**:
   - Używa Suspense dla loading state
   - Zawiera DataDisplay component
3. **Client Component (DataDisplay)**:
   - useSuspenseQuery z initialData
   - Umożliwia client-side refetch
   - Wyświetla JSON response

#### Observability
- **Instrumentation**: Server-side OTEL setup
  - Automatyczna instrumentacja Node.js
  - HTTP, fetch, Express auto-instrumentation
  - Eksport do OTEL Collector przez OTLP/gRPC

### BFF Service

#### HTTP Layer
- **Express App**: HTTP server na porcie 8087
- **CORS Middleware**: Umożliwia cross-origin requests z frontendów

#### Controllers (Route Handlers)
- **File Controller**: Proxy GET /file → file-service
- **DB Controller**: Proxy GET /db → db-service
- **Kafka Controller**: Proxy GET /kafka → kafka-service

Każdy controller:
- Loguje start/end operacji z timestampem
- Mierzy czas wykonania (endTime - startTime)
- Obsługuje błędy i zwraca odpowiednie status codes
- Automatycznie instrumentowany przez OTEL

#### Observability
- **Logger**: OTEL Logs API z severity levels (INFO, ERROR)
- **Instrumentation**: Auto-instrumentation Express + HTTP + fetch

### DB Service

#### Orchestration
- **DB Controller**: Orkiestruje równoległe wywołania do:
  - postgres-service (GET /postgres)
  - mongo-service (GET /mongo)
- Agreguje wyniki w jeden response: `{ mongo: {...}, postgres: {...} }`

#### Observability
- Logger z szczegółowymi eventami (starting to read from MongoDB, etc.)
- Auto-instrumentation tworzy spany dla każdego fetch

## Wzorce Projektowe

1. **Composition Pattern**: Root Layout + Pages + Components
2. **Server Component + Client Component**: Optymalizacja Next.js (SSR + interactivity)
3. **Suspense Pattern**: Async data loading z fallback UI
4. **Proxy Pattern**: BFF jako proxy dla backend services
5. **Anti-corruption Layer**: Postgres/Mongo services izolują szczegóły implementacyjne
6. **Observer Pattern**: OpenTelemetry jako observer dla wszystkich operacji
7. **Error Boundary Pattern**: Graceful error handling w React

## Data Flow

### SPA React (Client-Side)
1. User click → Component handler
2. Component → fetch API → Service
3. Service response → Component state update
4. FrontendTracer → create span → OTEL Collector

### SSR React (Hybrid)
1. **Server-Side**: Page component → fetch BFF → initialData
2. **Hydration**: Client otrzymuje pre-rendered HTML + initialData
3. **Client-Side**: User click refetch → useSuspenseQuery → BFF
4. Server instrumentation → spans → OTEL Collector

### BFF Orchestration
1. SSR request → BFF controller
2. BFF → fetch downstream service
3. Service response → BFF response
4. Logger emits + instrumentation creates spans

### DB Service Orchestration
1. Request → db controller
2. Parallel fetch → postgres-service + mongo-service
3. Aggregate responses
4. Return combined JSON
