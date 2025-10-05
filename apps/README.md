# Microfrontends Workspace

Workspace dla wszystkich aplikacji frontendowych w projekcie monitorowania mikrofrontendów.

## Struktura Projektów

```
apps/
├── spa-react/           # Single-SPA React Application (Port 4001)
├── mf-spa-react/        # Module Federation Host (Port 4002)
├── mf-remote-ui/        # Module Federation Remote (Port 4003)
└── package.json         # Workspace configuration
```

## Komendy

### 🚀 Szybki Start

```bash
# Zainstaluj zależności dla wszystkich projektów
npm run install:all

# Zabij wszystkie procesy na używanych portach (jeśli potrzebne)
npm run kill-ports

# Uruchom wszystkie aplikacje w trybie development
npm run dev
```

Po uruchomieniu będą dostępne:
- **Single-SPA React**: http://localhost:4001
- **MF Host**: http://localhost:4002  
- **MF Remote**: http://localhost:4003

### 🔧 Rozwiązywanie problemów z portami

```bash
# Sprawdź które porty są zajęte
npm run check-ports

# Zabij procesy na wszystkich używanych portach
npm run kill-ports

# Uruchom z automatycznym wykrywaniem wolnych portów
npm run dev:auto
```

### 📦 Instalacja Zależności

```bash
# Wszystkie projekty jednocześnie
npm run install:all

# Pojedyncze projekty
npm run install:spa      # spa-react
npm run install:mf-host  # mf-spa-react
npm run install:mf-remote # mf-remote-ui
```

### 🛠️ Development

```bash
# Wszystkie aplikacje jednocześnie (nowe porty)
npm run dev

# Automatyczne wykrywanie wolnych portów
npm run dev:auto

# Pojedyncze aplikacje
npm run dev:spa          # Single-SPA React (Port 4001)
npm run dev:mf-host      # Module Federation Host (Port 4002)
npm run dev:mf-remote    # Module Federation Remote (Port 4003)
```

### 🏗️ Build

```bash
# Build wszystkich aplikacji
npm run build

# Build pojedynczych aplikacji
npm run build:spa
npm run build:mf-host
npm run build:mf-remote
```

### 🔍 Preview (Production Mode)

```bash
# Preview wszystkich aplikacji
npm run preview

# Preview pojedynczych aplikacji
npm run preview:spa
npm run preview:mf-host
npm run preview:mf-remote
```

### 🧹 Czyszczenie

```bash
# Usuń node_modules i dist ze wszystkich projektów
npm run clean
```

### 🔧 Quality Checks

```bash
# Lint wszystkich projektów
npm run lint

# Type checking wszystkich projektów
npm run type-check
```

### 🚀 Production Start

```bash
# Uruchom wszystkie aplikacje w trybie produkcyjnym
npm run start:production
```

## Monitoring i Telemetria

Wszystkie aplikacje są zinstrumentowane OpenTelemetry:

- **Frontend Tracing**: Core Web Vitals, User Interactions
- **API Monitoring**: HTTP calls do mikroserwisów
- **Module Federation Tracing**: Cross-application correlation

### Telemetria Endpoints:

- **File Service**: http://localhost:8080
- **DB Service**: http://localhost:8083
- **OTEL Collector**: http://localhost:4317
- **Grafana**: http://localhost:3000

## Architektura

### Single-SPA React (Port 3001)
- Tradycyjna SPA z React Router
- Calls: `file-service` + `db-service`
- Frontend telemetry z OpenTelemetry

### Module Federation Host (Port 3002)
- Webpack Module Federation host
- Dynamicznie ładuje remote components
- Calls: `db-service`

### Module Federation Remote (Port 3003)
- Exportuje komponenty dla host application
- Niezależna telemetria
- Calls: `db-service`

## Troubleshooting

### Port już w użyciu
```bash
# Sprawdź co używa portów
lsof -i :4001
lsof -i :4002
lsof -i :4003

# Zabij wszystkie procesy na używanych portach
npm run kill-ports

# Lub zabij konkretny proces
kill -9 <PID>

# Sprawdź dostępność portów
npm run check-ports
```

### Module Federation nie działa
```bash
# Upewnij się, że remote jest uruchomiony przed host
npm run dev:mf-remote
# Potem w nowym terminalu:
npm run dev:mf-host
```

### Brak telemetrii
```bash
# Sprawdź czy OTEL Collector działa
curl http://localhost:4317/health

# Sprawdź czy serwisy backendowe działają
curl http://localhost:8080/health
curl http://localhost:8083/health
```

## Development Tips

1. **Kolejność uruchamiania**: Remote → Host dla Module Federation
2. **Hot Reload**: Wszystkie aplikacje obsługują hot reload
3. **CORS**: Konfiguracja proxy w vite.config dla API calls
4. **Telemetria**: Automatyczna instrumentacja HTTP calls i Core Web Vitals

## Requirements

- **Node.js**: >=18.0.0
- **pnpm**: >=8.0.0 (używane w projektach)
- **Docker**: Do uruchomienia backendu (opcjonalnie)