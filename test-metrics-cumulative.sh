#!/bin/bash

echo "=== Testing Cumulative Metrics After Restart ==="
echo ""
echo "Instructions:"
echo "1. Stop the frontend dev server (Ctrl+C)"
echo "2. Run: cd apps/spa-react && yarn dev"
echo "3. Wait for it to start (~5 seconds)"
echo "4. Navigate to http://localhost:5173/file in your browser"
echo "5. Click the 'Rerun' button 3-4 times"
echo "6. Wait 10 seconds for metrics to export"
echo "7. Run this script again"
echo ""
echo "Press Enter when ready to check metrics..."
read

echo "Checking Prometheus for cumulative behavior..."
echo ""

echo "=== File Endpoint Count (should increase with each request) ==="
curl -s 'http://localhost:9090/api/v1/query?query=frontend_endpoint_duration_milliseconds_count{http_endpoint=~".*file.*"}' | \
  jq -r '.data.result[] | "Endpoint: \(.metric.http_endpoint) | Route: \(.metric.http_route) | Count: \(.value[1])"'
echo ""

echo "=== Total Sum (should accumulate) ==="
curl -s 'http://localhost:9090/api/v1/query?query=frontend_endpoint_duration_milliseconds_sum{http_endpoint=~".*file.*"}' | \
  jq -r '.data.result[] | "Endpoint: \(.metric.http_endpoint) | Sum: \(.value[1])ms"'
echo ""

echo "=== Request Counter (should increment) ==="
curl -s 'http://localhost:9090/api/v1/query?query=frontend_endpoint_requests_total{http_endpoint=~".*file.*"}' | \
  jq -r '.data.result[] | "Endpoint: \(.metric.http_endpoint) | Total Requests: \(.value[1])"'
echo ""

echo "=== Average Latency Calculation ==="
ENDPOINT="http://localhost:8087/file"
COUNT=$(curl -s "http://localhost:9090/api/v1/query?query=frontend_endpoint_duration_milliseconds_count{http_endpoint=\"$ENDPOINT\"}" | jq -r '.data.result[0].value[1] // 0')
SUM=$(curl -s "http://localhost:9090/api/v1/query?query=frontend_endpoint_duration_milliseconds_sum{http_endpoint=\"$ENDPOINT\"}" | jq -r '.data.result[0].value[1] // 0')

if [ "$COUNT" != "0" ] && [ "$COUNT" != "null" ]; then
  AVG=$(echo "scale=2; $SUM / $COUNT" | bc)
  echo "Count: $COUNT | Sum: ${SUM}ms | Average: ${AVG}ms"
else
  echo "No data yet - make sure to navigate to /file and click Rerun"
fi
echo ""

echo "=== Verify Cumulative Behavior ==="
echo "If count stays at 1 after multiple clicks → Still in DELTA mode (restart needed)"
echo "If count increases (2, 3, 4...) → CUMULATIVE mode working ✅"
