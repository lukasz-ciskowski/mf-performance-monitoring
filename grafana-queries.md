# Grafana Queries for Frontend Endpoint Metrics

## ✅ Your metrics ARE working! Here's proof:

### Total Request Count (shows increments)
```promql
sum(frontend_endpoint_duration_milliseconds_count) by (http_endpoint)
```

### Request Rate (requests per second)
```promql
rate(frontend_endpoint_duration_milliseconds_count[1m])
```

### Total Requests Over Time (cumulative)
```promql
frontend_endpoint_duration_milliseconds_count
```

### Average Latency by Endpoint
```promql
rate(frontend_endpoint_duration_milliseconds_sum[1m]) 
/ 
rate(frontend_endpoint_duration_milliseconds_count[1m])
```

### P95 Latency
```promql
histogram_quantile(0.95, 
  sum(rate(frontend_endpoint_duration_milliseconds_bucket[1m])) by (le, http_endpoint)
)
```

### Request Count Table
```promql
sum by (http_endpoint, http_route, http_status_code) (
  frontend_endpoint_duration_milliseconds_count
)
```

---

## Why you thought it wasn't working:

1. **OTEL Collector endpoint (8889)** shows **instantaneous state** - this resets after export
2. **Prometheus** has the **cumulative data** - this is what you should query
3. The count IS incrementing - you can see it went from 1 → 2 for `/file` endpoint

## To verify it's working:

1. Open Grafana: http://localhost:3000
2. Go to Explore
3. Run this query:
   ```promql
   frontend_endpoint_duration_milliseconds_count{http_endpoint=~".*file.*"}
   ```
4. Navigate to `/file` page multiple times
5. Refresh the query - you'll see the count increase

## Dashboard Panel Config:

**Panel 1: Request Count by Endpoint**
- Visualization: Stat
- Query: `sum(frontend_endpoint_duration_milliseconds_count) by (http_endpoint)`
- Transform: Last (not null)

**Panel 2: Request Rate**
- Visualization: Time series
- Query: `rate(frontend_endpoint_duration_milliseconds_count[1m])`

**Panel 3: Average Latency**
- Visualization: Time series
- Query: 
  ```promql
  rate(frontend_endpoint_duration_milliseconds_sum[1m]) 
  / 
  rate(frontend_endpoint_duration_milliseconds_count[1m])
  ```
