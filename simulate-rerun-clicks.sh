#!/bin/bash

BFF_URL="http://localhost:8087"
ITERATIONS=10

echo "=== Simulating 10 'Rerun' button clicks ==="
echo ""

echo "Calling /db endpoint ${ITERATIONS} times..."
for i in $(seq 1 $ITERATIONS); do
    echo -n "Request $i/10... "
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}" "$BFF_URL/db")
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
    TIME=$(echo "$RESPONSE" | grep "TIME:" | cut -d: -f2)
    echo "Status: $HTTP_CODE | Time: ${TIME}s"
    sleep 0.5
done

echo ""
echo "Calling /file endpoint ${ITERATIONS} times..."
for i in $(seq 1 $ITERATIONS); do
    echo -n "Request $i/10... "
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}" "$BFF_URL/file")
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
    TIME=$(echo "$RESPONSE" | grep "TIME:" | cut -d: -f2)
    echo "Status: $HTTP_CODE | Time: ${TIME}s"
    sleep 0.5
done

echo ""
echo "✅ Done! Wait 5-10 seconds for metrics to export, then check Prometheus:"
echo ""
echo "Check metrics with:"
echo "./debug-metrics.sh"
echo ""
echo "Or query Prometheus directly:"
echo "curl -s 'http://localhost:9090/api/v1/query?query=frontend_endpoint_duration_milliseconds_count' | jq '.data.result[] | {endpoint: .metric.http_endpoint, count: .value[1]}'"
