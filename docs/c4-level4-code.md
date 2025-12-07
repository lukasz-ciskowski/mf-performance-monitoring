# C4 Model - Level 4: Code Diagram

## Przegląd

Diagram kodu przedstawia szczegóły implementacyjne kluczowych komponentów, pokazując klasy, metody i zależności na poziomie kodu źródłowego.

## Diagram 1: SPA React - Frontend Tracer (OpenTelemetry Setup)

```mermaid
classDiagram
    class FrontendTracer {
        -tracerProviderInstance: WebTracerProvider
        -meterProviderInstance: MeterProvider
        +FrontendTracer() Tracer
        +getTracerProvider() WebTracerProvider
        +getMeterProvider() MeterProvider
    }

    class WebTracerProvider {
        -resource: Resource
        -spanProcessors: SpanProcessor[]
        +getTracer(name: string) Tracer
        +register(config: SDKConfig)
        +shutdown()
    }

    class Resource {
        -attributes: Attributes
        +merge(other: Resource) Resource
        +getAttribute(key: string) any
    }

    class SimpleSpanProcessor {
        -exporter: SpanExporter
        +onStart(span: Span)
        +onEnd(span: Span)
        +shutdown()
    }

    class OTLPTraceExporter {
        -url: string
        +export(spans: ReadableSpan[])
        +shutdown()
    }

    class CompositePropagator {
        -propagators: TextMapPropagator[]
        +inject(context: Context, carrier: object)
        +extract(context: Context, carrier: object)
    }

    class W3CTraceContextPropagator {
        +inject(context: Context, carrier: object)
        +extract(context: Context, carrier: object)
    }

    class W3CBaggagePropagator {
        +inject(context: Context, carrier: object)
        +extract(context: Context, carrier: object)
    }

    class ZoneContextManager {
        +active() Context
        +with(context: Context, fn: Function)
    }

    class FetchInstrumentation {
        -config: FetchInstrumentationConfig
        +applyCustomAttributesOnSpan()
        +enable()
        +disable()
    }

    class MeterProvider {
        -resource: Resource
        -readers: MetricReader[]
        +getMeter(name: string) Meter
    }

    class PeriodicExportingMetricReader {
        -exporter: MetricExporter
        -exportIntervalMillis: number
        +collect()
        +shutdown()
    }

    class OTLPMetricExporter {
        -url: string
        +export(metrics: ResourceMetrics)
    }

    FrontendTracer --> WebTracerProvider : creates (singleton)
    FrontendTracer --> MeterProvider : creates (singleton)
    WebTracerProvider --> Resource : uses
    WebTracerProvider --> SimpleSpanProcessor : registers
    SimpleSpanProcessor --> OTLPTraceExporter : delegates
    WebTracerProvider --> CompositePropagator : registers
    CompositePropagator --> W3CTraceContextPropagator : contains
    CompositePropagator --> W3CBaggagePropagator : contains
    WebTracerProvider --> ZoneContextManager : uses
    FrontendTracer --> FetchInstrumentation : registers
    MeterProvider --> Resource : uses
    MeterProvider --> PeriodicExportingMetricReader : registers
    PeriodicExportingMetricReader --> OTLPMetricExporter : uses

    note for FrontendTracer "Singleton pattern - jedna instancja\nna całą aplikację SPA"
    note for OTLPTraceExporter "Domyślny URL: http://localhost:4318/v1/traces"
    note for OTLPMetricExporter "URL: http://localhost:4318/v1/metrics\nEksport co 10s"
    note for FetchInstrumentation "Propaguje traceparent header\nDodaje peer.service attribute"
```

## Diagram 2: SSR React - Server-Side Instrumentation

```mermaid
classDiagram
    class InstrumentationRegister {
        +register() Promise~void~
    }

    class NodeSDK {
        -resource: Resource
        -traceExporter: SpanExporter
        -metricReader: MetricReader
        -instrumentations: Instrumentation[]
        +start() void
        +shutdown() Promise~void~
    }

    class Resource {
        -attributes: Attributes
        +merge(other: Resource) Resource
        +default() Resource
    }

    class OTLPTraceExporter {
        -url: string
        +export(spans: ReadableSpan[])
    }

    class OTLPMetricExporter {
        -url: string
        +export(metrics: ResourceMetrics)
    }

    class PeriodicExportingMetricReader {
        -exporter: MetricExporter
        +collect()
    }

    class HttpInstrumentation {
        -config: HttpInstrumentationConfig
        +ignoreIncomingRequestHook()
        +enable()
    }

    class SemanticAttributes {
        +SEMRESATTRS_SERVICE_NAME: string
        +SEMRESATTRS_SERVICE_VERSION: string
    }

    InstrumentationRegister --> NodeSDK : creates and starts
    NodeSDK --> Resource : uses
    Resource --> SemanticAttributes : contains
    NodeSDK --> OTLPTraceExporter : uses
    NodeSDK --> PeriodicExportingMetricReader : registers
    PeriodicExportingMetricReader --> OTLPMetricExporter : uses
    NodeSDK --> HttpInstrumentation : registers

    note for InstrumentationRegister "Next.js wywołuje register()\nautomatycznie przy starcie"
    note for HttpInstrumentation "Ignoruje: _next, favicon, /health\nAuto-instrumentuje HTTP calls"
    note for Resource "Attributes:\n- service.name: ssr-react\n- service.version: 1.0.0\n- service.namespace: frontend"
    note for NodeSDK "SIGTERM handler dla\ngraceful shutdown"
```

## Diagram 3: FileServiceButton Component - Data Flow

```mermaid
sequenceDiagram
    participant User
    participant FileButton as FileServiceButton
    participant State as React State
    participant FetchAPI as Fetch API
    participant Tracer as FrontendTracer
    participant Service as file-service
    participant OTEL as OTEL Collector

    User->>FileButton: Click button
    FileButton->>State: setResponse(null)
    FileButton->>FetchAPI: fetch('/file-service/file')
    
    Note over FetchAPI,Tracer: FetchInstrumentation intercepts
    FetchAPI->>Tracer: Create span (auto)
    Tracer->>Tracer: Add traceparent header
    Tracer->>Tracer: Set peer.service attribute
    
    FetchAPI->>Service: HTTP GET /file
    Note over Service: Process request
    Service-->>FetchAPI: Response { status: 200, data: "..." }
    
    FetchAPI->>Tracer: End span (auto)
    Tracer->>OTEL: Export span (OTLP/HTTP)
    
    FetchAPI-->>FileButton: JSON response
    FileButton->>State: setResponse(data)
    FileButton->>User: Display response in <pre>
```

## Diagram 4: SSR React - DbContent Component Flow

```mermaid
sequenceDiagram
    participant Browser
    participant Server as Next.js Server
    participant Page as DB Page (RSC)
    participant BFF as BFF Service
    participant Inst as Instrumentation
    participant Content as DbContent (Client)
    participant Display as DbDataDisplay
    participant Query as useSuspenseQuery
    participant OTEL as OTEL Collector

    Browser->>Server: GET /db
    Server->>Inst: Auto-instrument request
    Server->>Page: Render RSC
    
    Page->>BFF: Server fetch: /db
    Note over Inst: HttpInstrumentation creates span
    BFF-->>Page: initialData
    
    Page->>Content: Pass initialData
    Content->>Display: Wrap with Suspense
    Display->>Query: useSuspenseQuery({ initialData })
    
    Server->>Browser: HTML + hydration data
    Browser->>Display: Hydrate component
    
    Note over Display: User clicks "Rerun"
    Display->>Query: refetch()
    Query->>BFF: Client fetch: /db
    BFF-->>Query: Fresh data
    Query->>Display: Update UI
    
    Inst->>OTEL: Export spans (OTLP/gRPC)
```

## Diagram 5: BFF Service - Controller Implementation

```mermaid
classDiagram
    class ExpressApp {
        +use(middleware: Function)
        +get(path: string, handler: Function)
        +listen(port: number, callback: Function)
    }

    class CORSMiddleware {
        +handle(req: Request, res: Response, next: Function)
    }

    class FileController {
        -FILE_SERVICE_URL: string
        +handleFileRequest(req: Request, res: Response)
    }

    class DbController {
        -DB_SERVICE_URL: string
        +handleDbRequest(req: Request, res: Response)
    }

    class KafkaController {
        -KAFKA_SERVICE_URL: string
        +handleKafkaRequest(req: Request, res: Response)
    }

    class Logger {
        -logger: OTELLogger
        +emit(log: LogRecord)
    }

    class Instrumentation {
        +setup() void
    }

    class OTELLogger {
        +emit(log: LogRecord)
    }

    ExpressApp --> CORSMiddleware : uses
    ExpressApp --> FileController : route /file
    ExpressApp --> DbController : route /db
    ExpressApp --> KafkaController : route /kafka
    
    FileController --> Logger : logs operations
    DbController --> Logger : logs operations
    KafkaController --> Logger : logs operations
    
    Logger --> OTELLogger : delegates
    
    Instrumentation --> ExpressApp : auto-instruments
    
    note for FileController "1. Log start (INFO)\n2. fetch(FILE_SERVICE_URL)\n3. Log end with duration\n4. Return JSON or 500"
    note for DbController "1. Log start (INFO)\n2. fetch(DB_SERVICE_URL)\n3. Log end with duration\n4. Return JSON or 500"
    note for Instrumentation "Auto-instruments:\n- Express routes\n- HTTP client (fetch)\n- Async context propagation"
```

## Diagram 6: DB Service - Orchestration Logic

```mermaid
flowchart TD
    A[GET /db Request] --> B[Log: 'Received request']
    B --> C{Try}
    
    C --> D[Log: 'Starting MongoDB']
    D --> E[fetch MONGO_SERVICE_URL/mongo]
    
    C --> F[Log: 'Starting PostgreSQL']
    F --> G[fetch POSTGRES_SERVICE_URL/postgres]
    
    E --> H{Both Complete?}
    G --> H
    
    H -->|Success| I[Aggregate Responses]
    I --> J[Return JSON: {mongo, postgres}]
    
    H -->|Error| K[Log Error]
    K --> L[Return 500]
    
    J --> M[Instrumentation Creates Span]
    M --> N[Export to OTEL Collector]
    
    style A fill:#e1f5fe
    style J fill:#c8e6c9
    style L fill:#ffcdd2
    style N fill:#fff9c4
```

## Kluczowe Implementacje

### 1. FrontendTracer (SPA React)

```typescript
// Singleton pattern
let tracerProviderInstance: WebTracerProvider | null = null;
let meterProviderInstance: MeterProvider | null = null;

const FrontendTracer = () => {
    if (tracerProviderInstance) {
        return tracerProviderInstance.getTracer('example-tracer-web');
    }
    
    // Setup tracer provider
    const resource = resourceFromAttributes({
        [ATTR_SERVICE_NAME]: 'spa-react',
    });
    
    const tracerProvider = new WebTracerProvider({
        resource,
        spanProcessors: [new SimpleSpanProcessor(new OTLPTraceExporter())],
    });
    
    // Context propagation
    tracerProvider.register({
        contextManager: new ZoneContextManager(),
        propagator: new CompositePropagator({
            propagators: [
                new W3CBaggagePropagator(),
                new W3CTraceContextPropagator()
            ],
        }),
    });
    
    // Fetch instrumentation with custom attributes
    registerInstrumentations({
        tracerProvider,
        instrumentations: [
            new FetchInstrumentation({
                propagateTraceHeaderCorsUrls: [/.+/g],
                applyCustomAttributesOnSpan: (span, _request, response) => {
                    if (response instanceof Response) {
                        const service = response.url.split('/')[3];
                        span.setAttribute('peer.service', service);
                    }
                },
            }),
        ],
    });
    
    return webTracer;
};
```

**Kluczowe cechy:**
- Singleton dla całej aplikacji SPA
- Automatyczne propagowanie `traceparent` header
- Custom attribute `peer.service` dla lepszej identyfikacji targetów
- Zone.js context manager dla async operations
- Export co 10s dla metryk

### 2. SSR Instrumentation (Next.js)

```typescript
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const resource = Resource.default().merge(
            new Resource({
                [SEMRESATTRS_SERVICE_NAME]: 'ssr-react',
                [SEMRESATTRS_SERVICE_VERSION]: '1.0.0',
                'service.namespace': 'frontend',
            }),
        );
        
        const sdk = new NodeSDK({
            resource,
            traceExporter: new OTLPTraceExporter({
                url: 'http://localhost:4318/v1/traces',
            }),
            metricReader: new PeriodicExportingMetricReader({
                exporter: new OTLPMetricExporter({
                    url: 'http://localhost:4318/v1/metrics',
                }),
            }),
            instrumentations: [
                new HttpInstrumentation({
                    ignoreIncomingRequestHook: (req) => {
                        return req.url?.includes('_next') || 
                               req.url?.includes('favicon') || 
                               req.url === '/health';
                    },
                }),
            ],
        });
        
        sdk.start();
        
        // Graceful shutdown
        process.on('SIGTERM', () => {
            sdk.shutdown()
                .then(() => console.log('OpenTelemetry terminated'))
                .finally(() => process.exit(0));
        });
    }
}
```

**Kluczowe cechy:**
- Automatyczne wywołanie przez Next.js przy starcie
- Filtrowanie requestów (_next, favicon, health)
- Graceful shutdown na SIGTERM
- Server-side only (check NEXT_RUNTIME)
- Semantic attributes dla namespace i instance ID

### 3. FileServiceButton Component

```typescript
const FileServiceButton = () => {
    const [response, setResponse] = useState<string | null>(null);
    
    const handleClick = async () => {
        setResponse(null);
        // FetchInstrumentation automatycznie tworzy span
        const response = await fetch('/file-service/file');
        const data = await response.json();
        setResponse(JSON.stringify(data, null, 2));
    };
    
    return (
        <div>
            <button onClick={handleClick}>
                Call single file service request
            </button>
            {response && <pre>{response}</pre>}
        </div>
    );
};
```

**Kluczowe cechy:**
- Prosta async operacja fetch
- Auto-instrumentation przez FetchInstrumentation
- State management dla loading/success states
- Wyświetlanie JSON response

### 4. BFF File Controller

```typescript
app.get('/file', async (req, res) => {
    const startTime = Date.now();
    
    logger.emit({
        severityNumber: SeverityNumber.INFO,
        body: 'Received request to read file through BFF',
    });
    
    try {
        const fileContent = await fetch(`${FILE_SERVICE_URL}/file`);
        const fileResponse = await fileContent.json();
        
        const endTime = Date.now();
        logger.emit({
            severityNumber: SeverityNumber.INFO,
            body: `File read through BFF successfully in ${endTime - startTime} ms`,
        });
        
        res.json(fileResponse);
    } catch (error) {
        logger.emit({
            severityNumber: SeverityNumber.ERROR,
            body: `Error reading file through BFF: ${error.message}`,
        });
        res.status(500).json({ status: 500, message: 'Error reading file' });
    }
});
```

**Kluczowe cechy:**
- Manual timing measurement (startTime/endTime)
- Structured logging z severity levels
- Error handling z try/catch
- Proxy pattern (forward request to downstream service)

## Design Patterns Użyte

1. **Singleton**: FrontendTracer provider instances
2. **Factory**: OTEL SDK setup functions
3. **Observer**: OpenTelemetry instrumentation observers
4. **Proxy**: BFF jako proxy dla backend services
5. **Decorator**: Instrumentation decoruje funkcje fetch/http
6. **Strategy**: Różne exportery (OTLP, Console) jako strategie
7. **Composite**: CompositePropagator zawiera multiple propagators

## Performance Considerations

1. **SimpleSpanProcessor vs BatchSpanProcessor**: 
   - SPA używa SimpleSpanProcessor dla immediate export
   - Production powinien używać BatchSpanProcessor

2. **Zone.js Context Manager**:
   - Zachowuje async context w Angular-like apps
   - Overhead dla każdego async operation

3. **Export Intervals**:
   - Metrics: 10s interval
   - Traces: Immediate (SimpleSpanProcessor)

4. **Resource Attributes**:
   - Statyczne (set once at startup)
   - Propagowane do wszystkich spans/metrics

## Security Considerations

1. **CORS Configuration**: Umożliwia cross-origin dla frontendów
2. **Header Propagation**: W3C Trace Context standard
3. **URL Filtering**: Ignorowanie sensitive paths (_next, health)
4. **Error Masking**: Nie eksponowanie stack traces w API responses
