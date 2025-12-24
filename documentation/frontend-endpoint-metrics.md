# SPA-React Endpoint Metrics Implementation

## Overview

This implementation adds comprehensive endpoint loading time metrics to the `spa-react` application. The metrics track **average and max endpoint loading times** using OpenTelemetry histograms, which automatically provide statistical aggregations including average, max, min, and percentiles.

## Architecture

### Core Components

1. **`endpoint-metrics.ts`**: Core telemetry utility that:
   - Initializes OpenTelemetry meter for endpoint metrics
   - Provides `trackedFetch()` wrapper function
   - Records histogram data for duration, request counts, and errors
   - Auto-initializes on module load

2. **`useEndpointMetrics.tsx`**: React hook providing:
   - Manual tracking APIs (`startTracking`, `completeTracking`)
   - Automatic `trackedFetch` wrapper
   - Component-scoped metric tracking

3. **Integration Points**:
   - Routes: `/file`, `/db`, `/kafka` (all route-level data fetching)
   - Components: `FileServiceButton`, `DbServiceButton` (user-triggered requests)

## Metrics Collected

### 1. `frontend.endpoint.duration_milliseconds` (Histogram)

**Type**: Histogram  
**Unit**: Milliseconds  
**Description**: Time taken for endpoint requests to complete

**Labels**:
- `service.name`: Always `spa-react`
- `http.endpoint`: The endpoint URL (e.g., `http://localhost:8087/file`)
- `http.method`: HTTP method (GET, POST, etc.)
- `http.route`: Current browser route (e.g., `/file`)
- `http.status_code`: HTTP status code (200, 404, 500, etc.)
- `http.status_class`: Status class (2xx, 3xx, 4xx, 5xx)
- `request.success`: `true` or `false`

**Histogram Buckets** (milliseconds):
```
[10, 25, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000]
```

### 2. `frontend.endpoint.requests_total` (Counter)

**Type**: Counter  
**Description**: Total number of endpoint requests made

**Labels**: Same as duration histogram

### 3. `frontend.endpoint.errors_total` (Counter)

**Type**: Counter  
**Description**: Total number of failed endpoint requests

**Labels**: Same as duration histogram

## Querying Metrics

### Average Endpoint Loading Time

```promql
# Average duration for all endpoints (5-minute window)
rate(frontend_endpoint_duration_milliseconds_sum[5m]) 
/ 
rate(frontend_endpoint_duration_milliseconds_count[5m])

# Average by endpoint
rate(frontend_endpoint_duration_milliseconds_sum[5m]) 
/ 
rate(frontend_endpoint_duration_milliseconds_count[5m]) 
BY (http_endpoint)

# Average by route
rate(frontend_endpoint_duration_milliseconds_sum[5m]) 
/ 
rate(frontend_endpoint_duration_milliseconds_count[5m]) 
BY (http_route)
```

### Maximum Endpoint Loading Time

```promql
# Max duration in the last 5 minutes (95th percentile)
histogram_quantile(0.95, 
  rate(frontend_endpoint_duration_milliseconds_bucket[5m])
)

# Max duration (99th percentile) by endpoint
histogram_quantile(0.99, 
  sum(rate(frontend_endpoint_duration_milliseconds_bucket[5m])) BY (le, http_endpoint)
)

# Absolute maximum observed (use max_over_time with gauge conversion)
max_over_time(
  histogram_quantile(1.0, 
    rate(frontend_endpoint_duration_milliseconds_bucket[5m])
  )[5m:]
)
```

### Percentile Queries

```promql
# 50th percentile (median)
histogram_quantile(0.50, 
  rate(frontend_endpoint_duration_milliseconds_bucket[5m])
)

# 90th percentile
histogram_quantile(0.90, 
  rate(frontend_endpoint_duration_milliseconds_bucket[5m])
)

# 99th percentile
histogram_quantile(0.99, 
  rate(frontend_endpoint_duration_milliseconds_bucket[5m])
)
```

### Request Rate & Success Rate

```promql
# Total request rate (requests per second)
rate(frontend_endpoint_requests_total[5m])

# Request rate by endpoint
sum(rate(frontend_endpoint_requests_total[5m])) BY (http_endpoint)

# Error rate
rate(frontend_endpoint_errors_total[5m])

# Success rate percentage
(
  rate(frontend_endpoint_requests_total{request_success="true"}[5m])
  /
  rate(frontend_endpoint_requests_total[5m])
) * 100
```

### Duration by Status Class

```promql
# Average duration for successful requests (2xx)
rate(frontend_endpoint_duration_milliseconds_sum{http_status_class="2xx"}[5m])
/
rate(frontend_endpoint_duration_milliseconds_count{http_status_class="2xx"}[5m])

# Average duration for errors (5xx)
rate(frontend_endpoint_duration_milliseconds_sum{http_status_class="5xx"}[5m])
/
rate(frontend_endpoint_duration_milliseconds_count{http_status_class="5xx"}[5m])
```

## Grafana Dashboard Panels

### Panel 1: Average Response Time (Time Series)

```promql
# Query
rate(frontend_endpoint_duration_milliseconds_sum[5m]) 
/ 
rate(frontend_endpoint_duration_milliseconds_count[5m])

# Legend: {{http_endpoint}} - {{http_method}}
```

### Panel 2: P95/P99 Response Time (Time Series)

```promql
# P95
histogram_quantile(0.95, 
  sum(rate(frontend_endpoint_duration_milliseconds_bucket[5m])) BY (le, http_endpoint)
)

# P99
histogram_quantile(0.99, 
  sum(rate(frontend_endpoint_duration_milliseconds_bucket[5m])) BY (le, http_endpoint)
)

# Legend: P95 - {{http_endpoint}}, P99 - {{http_endpoint}}
```

### Panel 3: Request Rate (Time Series)

```promql
sum(rate(frontend_endpoint_requests_total[5m])) BY (http_endpoint)

# Legend: {{http_endpoint}}
```

### Panel 4: Error Rate (Time Series)

```promql
sum(rate(frontend_endpoint_errors_total[5m])) BY (http_endpoint)

# Legend: {{http_endpoint}}
```

### Panel 5: Success Rate Percentage (Gauge/Stat)

```promql
(
  sum(rate(frontend_endpoint_requests_total{request_success="true"}[5m]))
  /
  sum(rate(frontend_endpoint_requests_total[5m]))
) * 100

# Unit: Percent (0-100)
# Thresholds: Green > 99%, Yellow > 95%, Red < 95%
```

### Panel 6: Response Time Heatmap

```promql
# Query
sum(rate(frontend_endpoint_duration_milliseconds_bucket[5m])) BY (le)

# Visualization: Heatmap
# Format: Heatmap
```

## Usage Examples

### Example 1: Route-Level Automatic Tracking

```tsx
// In routes/file.tsx
import { trackedFetch } from '../utils/telemetry/endpoint-metrics';

async function fetchFile() {
    const res = await trackedFetch(`${BFF}/file`);
    const data = await res.json();
    return data;
}
```

### Example 2: Component-Level Manual Tracking

```tsx
import { useEndpointMetrics } from '../hooks/useEndpointMetrics';

function MyComponent() {
    const { trackedFetch } = useEndpointMetrics();

    const handleClick = async () => {
        const response = await trackedFetch('/api/data');
        const data = await response.json();
        // Metrics automatically recorded
    };
}
```

### Example 3: Manual Start/Complete Tracking

```tsx
import { useEndpointMetrics } from '../hooks/useEndpointMetrics';

function MyComponent() {
    const { startTracking, completeTracking } = useEndpointMetrics();

    const fetchData = async () => {
        const trackId = startTracking('/api/complex', 'POST');
        
        try {
            const response = await fetch('/api/complex', { method: 'POST' });
            completeTracking(trackId, response.ok, response.status);
            return await response.json();
        } catch (error) {
            completeTracking(trackId, false);
            throw error;
        }
    };
}
```

## Integration Checklist

✅ **Implemented**:
- [x] Core metrics utility (`endpoint-metrics.ts`)
- [x] React hook (`useEndpointMetrics.tsx`)
- [x] Auto-initialization on module load
- [x] Integration in `/file` route
- [x] Integration in `/db` route
- [x] Integration in `/kafka` route
- [x] Integration in `FileServiceButton` component
- [x] Integration in `DbServiceButton` component
- [x] Import in `main.tsx`

## Data Export & Collection

Metrics are exported via:
- **Protocol**: OTLP over HTTP
- **Endpoint**: `http://localhost:4318/v1/metrics`
- **Target**: OpenTelemetry Collector
- **Export Interval**: 5 seconds
- **Temporality**: Delta (Prometheus-compatible)

From OTEL Collector, metrics flow to:
- **Prometheus** (for storage & querying)
- **Grafana** (for visualization & alerting)

## Alignment with Thesis Goals

This implementation supports the thesis monitoring model by:

1. **Backend Complexity Correlation**: Endpoint duration metrics can be correlated with backend service dependency chains (file-service → kafka, db-service → postgres + mongo).

2. **SLI/SLO Definition**: Provides data for defining frontend-facing SLIs:
   - Availability: `success_rate >= 99.9%`
   - Latency: `p95_duration <= 500ms`
   - Error Budget: Track burn rate via error counters

3. **MTTR Reduction**: Granular endpoint-level metrics enable faster problem isolation (which endpoint, which route, which time window).

4. **User Experience Mapping**: Route-level labels (`http.route`) correlate technical metrics with user journeys.

5. **Observability Practices**: Demonstrates effective use of histograms, counters, and structured labels per metrics guidelines in `copilot-instructions.md`.

## Naming Convention Compliance

✅ Follows `<domain>_<resource>_<action|aspect>_<unit>` pattern:
- `frontend.endpoint.duration_milliseconds`
- `frontend.endpoint.requests_total`
- `frontend.endpoint.errors_total`

✅ Label cardinality controlled:
- Fixed set: `service.name`, `http.method`, `http.status_class`, `request.success`
- Bounded: `http.endpoint` (limited by route count), `http.route` (app routes)
- No dynamic/unbounded labels (no trace_id, user_id, etc.)

## Next Steps

1. **Add Grafana Dashboard**: Create a dedicated dashboard with the panel queries above
2. **Define SLOs**: Set target values for P95 latency and success rate
3. **Configure Alerts**: Set up alerts for SLO violations (e.g., P95 > 500ms for 5m)
4. **Chaos Testing**: Verify metrics capture degradations during simulated failures
5. **Correlation Analysis**: Link endpoint metrics with backend service metrics for complexity scoring

---

**Created**: December 22, 2025  
**Version**: 1.0  
**Maintainer**: Monitoring Model Implementation
