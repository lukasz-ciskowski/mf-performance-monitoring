# Diagramy Architektoniczne - Model Monitorowania Mikrofrontendów

## 1. Diagram Architektury Systemu

```mermaid
graph TB
    subgraph "Frontend Layer"
        SPA[spa-react:3001]
        MF1[mf-spa-react:3002]
        MF2[mf-remote-ui:3003]
    end
    
    subgraph "Microservices Layer"
        FS[file-service:8080]
        PS[postgres-service:8082]
        MS[mongo-service:8081]
        DS[db-service:8083]
        KS[kafka-service:8084]
        KRA[kafka-receiver-a:8085]
        KRB[kafka-receiver-b:8086]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL:5432)]
        MG[(MongoDB:27017)]
        KF[(Kafka:9092)]
        ZK[(Zookeeper:2181)]
    end
    
    subgraph "Monitoring Stack"
        GR[Grafana:3000]
        PR[Prometheus:9090]
        TP[Tempo:3200]
        LK[Loki:3100]
        OC[OTEL Collector:4317]
    end
    
    %% Direct connections from frontends to services
    SPA -.-> FS
    SPA -.-> DS
    MF1 -.-> FS
    MF1 -.-> DS
    MF2 -.-> FS
    MF2 -.-> DS
    
    %% Service-to-service communication
    DS --> PS
    DS --> MS
    
    %% Database connections
    PS --> PG
    MS --> MG
    
    %% Kafka messaging
    KS --> KF
    KRA --> KF
    KRB --> KF
    KF --> ZK
    
    %% Cross-service communication via Kafka
    FS -.-> KS
    DS -.-> KS
    
    %% Monitoring connections
    FS --> OC
    PS --> OC
    MS --> OC
    DS --> OC
    KS --> OC
    KRA --> OC
    KRB --> OC
    
    OC --> PR
    OC --> TP
    OC --> LK
    
    GR --> PR
    GR --> TP
    GR --> LK
    
    style SPA fill:#e1f5fe
    style MF1 fill:#e1f5fe
    style MF2 fill:#e1f5fe
    style FS fill:#f3e5f5
    style PS fill:#f3e5f5
    style MS fill:#f3e5f5
    style DS fill:#f3e5f5
    style KS fill:#f3e5f5
    style KRA fill:#f3e5f5
    style KRB fill:#f3e5f5
    style GR fill:#e8f5e8
    style PR fill:#e8f5e8
    style TP fill:#e8f5e8
    style LK fill:#e8f5e8
    style OC fill:#e8f5e8
```

## 2. Flow Procesu Monitorowania

```mermaid
flowchart TD
    A[Aplikacja Mikroserwisu] --> B[OpenTelemetry SDK]
    B --> C[Instrumentacja Automatyczna]
    B --> D[Custom Metrics]
    B --> E[Distributed Tracing]
    B --> F[Structured Logging]
    
    C --> G[OTEL Collector]
    D --> G
    E --> G
    F --> G
    
    G --> H[Prometheus<br/>Metrics Storage]
    G --> I[Tempo<br/>Trace Storage]
    G --> J[Loki<br/>Log Storage]
    
    H --> K[Grafana Dashboard]
    I --> K
    J --> K
    
    K --> L[Visualization]
    K --> M[Alerting]
    
    L --> N[Service Health]
    L --> O[Performance Metrics]
    L --> P[Business KPIs]
    
    M --> Q[Alert Manager]
    Q --> R[Notification<br/>Slack/Email]
    
    style A fill:#ffebee
    style G fill:#e3f2fd
    style K fill:#e8f5e8
    style L fill:#fff3e0
    style M fill:#fce4ec
```

## 3. Proces Zbierania Metryk

```mermaid
sequenceDiagram
    participant App as Mikroserwis
    participant SDK as OpenTelemetry SDK
    participant Collector as OTEL Collector
    participant Prom as Prometheus
    participant Grafana as Grafana
    
    App->>SDK: HTTP Request
    SDK->>SDK: Create Span
    SDK->>SDK: Record Metrics
    SDK->>SDK: Log Event
    
    SDK->>Collector: Send Telemetry (OTLP)
    Note over Collector: Batch Processing<br/>Filtering<br/>Enrichment
    
    Collector->>Prom: Push Metrics
    Collector->>Collector: Store Traces (Tempo)
    Collector->>Collector: Store Logs (Loki)
    
    Grafana->>Prom: Query Metrics
    Grafana->>Collector: Query Traces
    Grafana->>Collector: Query Logs
    
    Grafana->>Grafana: Correlate Data
    Grafana->>Grafana: Generate Dashboard
    
    Note over Grafana: Real-time Visualization<br/>Alerting<br/>Analysis
```

## 4. Model Procesowy Monitorowania

```mermaid
graph TB
    subgraph "1. Dostępność Mikroserwisów"
        A1[Health Checks]
        A2[HTTP Status Monitoring]
        A3[Response Time Tracking]
        A4[Throughput Measurement]
        
        A1 --> A5[API Availability Metrics]
        A2 --> A5
        A3 --> A5
        A4 --> A5
    end
    
    subgraph "2. Środowisko Mikroserwisów"
        B1[Container Metrics]
        B2[Resource Utilization]
        B3[Network Monitoring]
        B4[Storage Monitoring]
        
        B1 --> B5[Infrastructure Metrics]
        B2 --> B5
        B3 --> B5
        B4 --> B5
    end
    
    subgraph "3. Metryki Aplikacyjne"
        C1[Distributed Tracing]
        C2[Business Metrics]
        C3[Error Tracking]
        C4[Performance Profiling]
        
        C1 --> C5[Application Metrics]
        C2 --> C5
        C3 --> C5
        C4 --> C5
    end
    
    A5 --> D[Unified Monitoring Model]
    B5 --> D
    C5 --> D
    
    D --> E[Grafana Dashboards]
    D --> F[Alert Rules]
    D --> G[SLA Monitoring]
    
    E --> H[Stakeholder Reports]
    F --> I[Incident Response]
    G --> J[Performance Optimization]
    
    style A5 fill:#e3f2fd
    style B5 fill:#f3e5f5
    style C5 fill:#e8f5e8
    style D fill:#fff3e0
```

## 5. Architektura Telemetrii

```mermaid
graph LR
    subgraph "Instrumentation Layer"
        I1[Express.js Auto-instrumentation]
        I2[Custom Spans]
        I3[Metrics Collection]
        I4[Log Correlation]
    end
    
    subgraph "Collection Layer"
        C1[OTLP gRPC Receiver]
        C2[Prometheus Receiver]
        C3[Batch Processor]
        C4[Memory Limiter]
    end
    
    subgraph "Processing Layer"
        P1[Attribute Processor]
        P2[Resource Processor]
        P3[Transform Processor]
        P4[Filter Processor]
    end
    
    subgraph "Export Layer"
        E1[Prometheus Exporter]
        E2[OTLP Exporter]
        E3[Logging Exporter]
    end
    
    subgraph "Storage Layer"
        S1[(Prometheus TSDB)]
        S2[(Tempo Blocks)]
        S3[(Loki Chunks)]
    end
    
    I1 --> C1
    I2 --> C1
    I3 --> C2
    I4 --> C1
    
    C1 --> C3
    C2 --> C3
    C3 --> C4
    
    C4 --> P1
    P1 --> P2
    P2 --> P3
    P3 --> P4
    
    P4 --> E1
    P4 --> E2
    P4 --> E3
    
    E1 --> S1
    E2 --> S2
    E3 --> S3
    
    style I1 fill:#ffebee
    style C1 fill:#e3f2fd
    style P1 fill:#f3e5f5
    style E1 fill:#e8f5e8
    style S1 fill:#fff3e0
```

## 6. Service Dependency Map

```mermaid
graph TD
    subgraph "User Interface"
        UI[Browser/Mobile App]
    end
    
    subgraph "Microfrontends"
        MF1[mf-spa-react:3002]
        MF2[mf-remote-ui:3003]
        SPA[spa-react:3001]
    end
    
    subgraph "Business Services"
        FS[file-service:8080]
        DS[db-service:8083]
    end
    
    subgraph "Data Services"
        PS[postgres-service:8082]
        MS[mongo-service:8081]
    end
    
    subgraph "Messaging Services"
        KS[kafka-service:8084]
        KRA[kafka-receiver-a:8085]
        KRB[kafka-receiver-b:8086]
    end
    
    subgraph "External Dependencies"
        PG[(PostgreSQL:5432)]
        MG[(MongoDB:27017)]
        KF[(Apache Kafka:9092)]
        ZK[(Zookeeper:2181)]
    end
    
    %% User interactions
    UI --> MF1
    UI --> MF2
    UI --> SPA
    
    %% Frontend to backend API calls
    MF1 -.-> FS
    MF1 -.-> DS
    MF2 -.-> FS
    MF2 -.-> DS
    SPA -.-> FS
    SPA -.-> DS
    
    %% Service-to-service dependencies
    DS --> PS
    DS --> MS
    
    %% Optional async communication
    FS -.-> KS
    DS -.-> KS
    
    %% Database connections
    PS --> PG
    MS --> MG
    
    %% Kafka ecosystem
    KS --> KF
    KF --> KRA
    KF --> KRB
    KF --> ZK
    
    style UI fill:#e1f5fe
    style MF1 fill:#e1f5fe
    style MF2 fill:#e1f5fe
    style SPA fill:#e1f5fe
    style FS fill:#f3e5f5
    style DS fill:#f3e5f5
    style PS fill:#e8f5e8
    style MS fill:#e8f5e8
    style KS fill:#fff3e0
    style KRA fill:#fff3e0
    style KRB fill:#fff3e0
```

## 7. Monitoring Data Flow

```mermaid
flowchart LR
    subgraph "Data Sources"
        A1[HTTP Requests]
        A2[Database Queries]
        A3[Message Queue Events]
        A4[Container Stats]
        A5[Application Logs]
    end
    
    subgraph "Collection Points"
        B1[Service Endpoints]
        B2[Database Connectors]
        B3[Kafka Brokers]
        B4[Docker Daemon]
        B5[Application Runtime]
    end
    
    subgraph "Telemetry Pipeline"
        C1[Metrics Pipeline]
        C2[Traces Pipeline]
        C3[Logs Pipeline]
    end
    
    subgraph "Storage Systems"
        D1[Prometheus TSDB]
        D2[Tempo Backend]
        D3[Loki Storage]
    end
    
    subgraph "Visualization & Analysis"
        E1[Real-time Dashboards]
        E2[Trace Analysis]
        E3[Log Analysis]
        E4[Alert Rules]
    end
    
    A1 --> B1 --> C1 --> D1 --> E1
    A2 --> B2 --> C2 --> D2 --> E2
    A3 --> B3 --> C2 --> D2 --> E2
    A4 --> B4 --> C1 --> D1 --> E1
    A5 --> B5 --> C3 --> D3 --> E3
    
    E1 --> E4
    E2 --> E4
    E3 --> E4
    
    style C1 fill:#e3f2fd
    style C2 fill:#f3e5f5
    style C3 fill:#e8f5e8
    style E4 fill:#ffebee
```

## 8. Alert Management Flow

```mermaid
stateDiagram-v2
    [*] --> Normal
    Normal --> Warning : Threshold Exceeded
    Warning --> Critical : Condition Worsens
    Warning --> Normal : Condition Improves
    Critical --> Warning : Partial Recovery
    Critical --> Incident : Manual Escalation
    
    state Warning {
        [*] --> LogEvent
        LogEvent --> NotifyTeam
        NotifyTeam --> Monitor
        Monitor --> [*]
    }
    
    state Critical {
        [*] --> CreateTicket
        CreateTicket --> NotifyOnCall
        NotifyOnCall --> StartInvestigation
        StartInvestigation --> [*]
    }
    
    state Incident {
        [*] --> ActivateResponse
        ActivateResponse --> CoordinateTeams
        CoordinateTeams --> ImplementFix
        ImplementFix --> VerifyResolution
        VerifyResolution --> PostMortem
        PostMortem --> [*]
    }
    
    Incident --> Normal : Issue Resolved
```

## 9. Performance Metrics Hierarchy

```mermaid
mindmap
  root)Performance Monitoring(
    (Infrastructure)
      CPU Utilization
      Memory Usage
      Disk I/O
      Network Throughput
      Container Health
    (Application)
      Response Time
      Throughput (RPS)
      Error Rate
      Apdex Score
      Custom Business Metrics
    (User Experience)
      Page Load Time
      Time to Interactive
      Core Web Vitals
      User Journey Tracking
    (Dependencies)
      Database Performance
      External API Latency
      Message Queue Lag
      Cache Hit Ratio
    (SLA/SLO)
      Availability (99.9%)
      Latency P95 (< 200ms)
      Error Budget
      MTTR/MTBF
```

## 10. Single-SPA React - Service Dependencies

```mermaid
graph TD
    subgraph "User Interface"
        UI[Browser/Mobile App]
    end
    
    subgraph "Single-SPA Application"
        SPA[spa-react:3001<br/>Main Container]
        FSB[FileServiceButton]
        DSB[DbServiceButton]
        FT[Frontend Tracer<br/>OpenTelemetry]
    end
    
    subgraph "Backend Services"
        FS[file-service:8080]
        DS[db-service:8083]
    end
    
    subgraph "Data Services (via db-service)"
        PS[postgres-service:8082]
        MS[mongo-service:8081]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL:5432)]
        MG[(MongoDB:27017)]
    end
    
    subgraph "Monitoring Stack"
        OC[OTEL Collector:4317]
        GR[Grafana:3000]
    end
    
    %% User interactions
    UI --> SPA
    SPA --> FSB
    SPA --> DSB
    SPA --> FT
    
    %% API calls from components
    FSB -.->|"fetch('/file-service/file')"| FS
    DSB -.->|"fetch('/db-service/db')"| DS
    
    %% Service dependencies
    DS --> PS
    DS --> MS
    PS --> PG
    MS --> MG
    
    %% Telemetry flow
    FT -.->|Browser telemetry| OC
    FS --> OC
    DS --> OC
    PS --> OC
    MS --> OC
    
    OC --> GR
    
    style SPA fill:#e1f5fe
    style FSB fill:#bbdefb
    style DSB fill:#bbdefb
    style FT fill:#c8e6c9
    style FS fill:#f3e5f5
    style DS fill:#f3e5f5
    style PS fill:#e8f5e8
    style MS fill:#e8f5e8
    style OC fill:#fff3e0
```

## 11. Mikrofrontendy - Module Federation Architecture

```mermaid
flowchart TD
 subgraph subGraph0["User Interface"]
        UI["Browser/Mobile App"]
  end
 subgraph subGraph1["Host Application"]
        MF1["mf-spa-react:3002<br>Host Container"]
        MF1B["DbServiceButton - Host"]
        RL["Remote Loader"]
        n1["Frontend Tracer OpenTelemetry"]
  end
 subgraph subGraph2["Remote Application"]
        MF2["mf-remote-ui:3003<br>Remote Module"]
        MF2B["DbServiceButton - Remote"]
        n2["Frontend Tracer OpenTelemetry"]
  end
 subgraph subGraph4["Backend Services"]
        DS["db-service:8083"]
  end
 subgraph subGraph5["Data Services"]
        PS["postgres-service:8082"]
        MS["mongo-service:8081"]
  end
 subgraph subGraph6["Data Layer"]
        PG[("PostgreSQL:5432")]
        MG[("MongoDB:27017")]
  end
 subgraph subGraph7["Monitoring Stack"]
        OC["OTEL Collector:4317"]
        GR["Grafana:3000"]
  end
    UI --> MF1
    MF1 --> RL & MF1B
    RL -. "Dynamic import('remote/remote-ui-app')" .-> MFR["Webpack Module Federation"]
    MFR --> MF2
    DS --> PS & MS & OC
    PS --> PG & OC
    MS --> MG & OC
    TC["Telemetry Correlation"] -. Correlated traces .-> OC
    OC --> GR
    MF1B -- "fetch('/db-service/db')" --> DS
    MF2B -- "fetch('/db-service/db')" --> DS
    n1 -. Browser telemetry .-> OC
    n2 -. Browser telemetry .-> OC
    MF2 --> MF2B

    n1@{ shape: rect}
    n2@{ shape: rect}
    style MF1 fill:#e1f5fe
    style MF1B fill:#bbdefb
    style n1 fill:#C8E6C9
    style MF2 fill:#e1f5fe
    style MF2B fill:#bbdefb
    style n2 fill:#C8E6C9
    style DS fill:#f3e5f5
    style PS fill:#e8f5e8
    style MS fill:#e8f5e8
    style OC fill:#fff3e0
    style MFR fill:#f3e5f5
    style TC fill:#e8f5e8



```
