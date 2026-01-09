/**
 * APM Metrics Module for mongo-service
 * Implements USE (Utilization, Saturation, Errors) and RED (Rate, Errors, Duration) methods
 *
 * USE Method - Resource-oriented (for infrastructure):
 * - Utilization: How busy is the resource?
 * - Saturation: How much extra work is queued?
 * - Errors: Error count/rate
 *
 * RED Method - Request-oriented (for services):
 * - Rate: Requests per second
 * - Errors: Failed requests rate
 * - Duration: Request latency distribution
 *
 * Note: This complements OpenTelemetry auto-instrumentation by providing:
 * - Prometheus-style aggregated metrics (counters, histograms, gauges)
 * - Custom histogram buckets aligned with SLO thresholds
 * - USE metrics (CPU, memory, event loop) not provided by auto-instrumentation
 * - Metrics suitable for alerting and dashboard aggregations
 *
 * Auto-instrumentation provides traces (individual request details).
 * This module provides metrics (aggregated statistics for monitoring).
 */

import { metrics } from '@opentelemetry/api';
import * as os from 'os';
import * as v8 from 'v8';
import { Request, Response, NextFunction } from 'express';

const meter = metrics.getMeter('apm-metrics-mongo-service');

// ============================================================================
// RED Metrics - Request-oriented (Service Health)
// ============================================================================

const httpRequestCounter = meter.createCounter('http_requests_total', {
    description: 'Total number of HTTP requests',
    unit: '1',
});

const httpRequestDuration = meter.createHistogram('http_request_duration_seconds', {
    description: 'HTTP request duration in seconds',
    unit: 's',
});

const httpRequestErrors = meter.createCounter('http_request_errors_total', {
    description: 'Total number of HTTP request errors (5xx)',
    unit: '1',
});

const httpRequestSuccess = meter.createCounter('http_request_success_total', {
    description: 'Total number of successful HTTP requests (2xx, 3xx)',
    unit: '1',
});

let activeRequests = 0;
const httpActiveRequests = meter.createObservableGauge('http_requests_active', {
    description: 'Number of HTTP requests currently being processed',
    unit: '1',
});

httpActiveRequests.addCallback((observableResult) => {
    observableResult.observe(activeRequests);
});

// ============================================================================
// USE Metrics - Resource-oriented (Infrastructure Health)
// ============================================================================

let lastCpuUsage = process.cpuUsage();
let lastMeasureTime = Date.now();

const cpuUtilization = meter.createObservableGauge('process_cpu_utilization', {
    description: 'Process CPU utilization (0-1)',
    unit: '1',
});

cpuUtilization.addCallback((observableResult) => {
    const currentCpuUsage = process.cpuUsage();
    const currentTime = Date.now();
    const elapsedTime = (currentTime - lastMeasureTime) * 1000;

    const userDiff = currentCpuUsage.user - lastCpuUsage.user;
    const systemDiff = currentCpuUsage.system - lastCpuUsage.system;
    const totalDiff = userDiff + systemDiff;

    const utilization = totalDiff / elapsedTime / os.cpus().length;

    observableResult.observe(utilization, { type: 'total' });
    observableResult.observe(userDiff / elapsedTime / os.cpus().length, { type: 'user' });
    observableResult.observe(systemDiff / elapsedTime / os.cpus().length, { type: 'system' });

    lastCpuUsage = currentCpuUsage;
    lastMeasureTime = currentTime;
});

const cpuLoadAverage = meter.createObservableGauge('system_cpu_load_average', {
    description: 'System CPU load average',
    unit: '1',
});

cpuLoadAverage.addCallback((observableResult) => {
    const [load1, load5, load15] = os.loadavg();
    observableResult.observe(load1, { period: '1m' });
    observableResult.observe(load5, { period: '5m' });
    observableResult.observe(load15, { period: '15m' });
});

const memoryUtilization = meter.createObservableGauge('process_memory_utilization', {
    description: 'Process memory utilization',
    unit: 'By',
});

memoryUtilization.addCallback((observableResult) => {
    const memUsage = process.memoryUsage();

    observableResult.observe(memUsage.rss, { type: 'rss' });
    observableResult.observe(memUsage.heapTotal, { type: 'heap_total' });
    observableResult.observe(memUsage.heapUsed, { type: 'heap_used' });
    observableResult.observe(memUsage.external, { type: 'external' });
    observableResult.observe(memUsage.arrayBuffers, { type: 'array_buffers' });
});

const memoryUtilizationPercent = meter.createObservableGauge('process_memory_utilization_percent', {
    description: 'Process memory utilization as percentage',
    unit: '1',
});

memoryUtilizationPercent.addCallback((observableResult) => {
    const memUsage = process.memoryUsage();
    const totalSystemMemory = os.totalmem();

    observableResult.observe(memUsage.rss / totalSystemMemory, { type: 'rss' });
    observableResult.observe(memUsage.heapUsed / memUsage.heapTotal, { type: 'heap' });
});

const v8HeapStats = meter.createObservableGauge('process_v8_heap_stats', {
    description: 'V8 heap statistics',
    unit: 'By',
});

v8HeapStats.addCallback((observableResult) => {
    const heapStats = v8.getHeapStatistics();

    observableResult.observe(heapStats.total_heap_size, { type: 'total_heap_size' });
    observableResult.observe(heapStats.used_heap_size, { type: 'used_heap_size' });
    observableResult.observe(heapStats.heap_size_limit, { type: 'heap_size_limit' });
    observableResult.observe(heapStats.malloced_memory, { type: 'malloced_memory' });
    observableResult.observe(heapStats.peak_malloced_memory, { type: 'peak_malloced_memory' });
});

const gcDuration = meter.createHistogram('process_gc_duration_seconds', {
    description: 'Garbage collection duration',
    unit: 's',
});

const gcCount = meter.createCounter('process_gc_count_total', {
    description: 'Total number of garbage collections',
    unit: '1',
});

// Track GC if available
try {
    const { PerformanceObserver } = require('perf_hooks');
    const obs = new PerformanceObserver((list: any) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
            gcDuration.record(entry.duration / 1000, { kind: entry.kind || 'unknown' });
            gcCount.add(1, { kind: entry.kind || 'unknown' });
        });
    });
    obs.observe({ entryTypes: ['gc'], buffered: false });
} catch (e) {
    // GC observability not available
}

let lastEventLoopCheck = Date.now();
const eventLoopLag = meter.createObservableGauge('process_event_loop_lag_seconds', {
    description: 'Event loop lag in seconds (saturation indicator)',
    unit: 's',
});

eventLoopLag.addCallback((observableResult) => {
    const now = Date.now();
    const lag = (now - lastEventLoopCheck - 100) / 1000;
    observableResult.observe(Math.max(0, lag));
    lastEventLoopCheck = now;
});

const processUptime = meter.createObservableGauge('process_uptime_seconds', {
    description: 'Process uptime in seconds',
    unit: 's',
});

processUptime.addCallback((observableResult) => {
    observableResult.observe(process.uptime());
});

const processRestart = meter.createCounter('process_restart_total', {
    description: 'Total number of process restarts',
    unit: '1',
});

processRestart.add(1);

const networkBytesReceived = meter.createCounter('network_bytes_received_total', {
    description: 'Total bytes received over network',
    unit: 'By',
});

const networkBytesSent = meter.createCounter('network_bytes_sent_total', {
    description: 'Total bytes sent over network',
    unit: 'By',
});

// ============================================================================
// Database Operation Metrics
// ============================================================================

const dbOperationDuration = meter.createHistogram('db_operation_duration_seconds', {
    description: 'Database operation duration',
    unit: 's',
});

const dbOperationCounter = meter.createCounter('db_operations_total', {
    description: 'Total number of database operations',
    unit: '1',
});

const dbOperationErrors = meter.createCounter('db_operation_errors_total', {
    description: 'Total number of database operation errors',
    unit: '1',
});

// ============================================================================
// Express Middleware
// ============================================================================

export function apmMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
        // Skip APM tracking for health endpoints to avoid noise
        if (req.path.startsWith('/health')) {
            return next();
        }

        const startTime = Date.now();
        activeRequests++;

        const route = req.route?.path || req.path || 'unknown';
        const method = req.method;

        if (req.headers['content-length']) {
            networkBytesReceived.add(parseInt(req.headers['content-length']), {
                service: 'mongo-service',
            });
        }

        const originalSend = res.send;
        res.send = function (data: any) {
            const duration = (Date.now() - startTime) / 1000;
            const statusCode = res.statusCode;
            const statusClass = `${Math.floor(statusCode / 100)}xx`;

            httpRequestCounter.add(1, {
                method,
                route,
                status: statusCode.toString(),
                status_class: statusClass,
            });

            httpRequestDuration.record(duration, {
                method,
                route,
                status_class: statusClass,
            });

            if (statusCode >= 500) {
                httpRequestErrors.add(1, { method, route, status: statusCode.toString() });
            } else if (statusCode >= 200 && statusCode < 400) {
                httpRequestSuccess.add(1, { method, route, status_class: statusClass });
            }

            if (data) {
                const size = Buffer.byteLength(typeof data === 'string' ? data : JSON.stringify(data));
                networkBytesSent.add(size, {
                    service: 'mongo-service',
                });
            }

            activeRequests--;

            return originalSend.call(this, data);
        };

        next();
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

export function recordDbOperation(operation: string, database: string, durationSeconds: number, error?: boolean) {
    dbOperationDuration.record(durationSeconds, { operation, database });
    dbOperationCounter.add(1, { operation, database, status: error ? 'error' : 'success' });
    if (error) {
        dbOperationErrors.add(1, { operation, database });
    }
}

export function startTimer() {
    const start = Date.now();
    return {
        end: () => (Date.now() - start) / 1000,
    };
}

console.log('APM Metrics (USE + RED) initialized for mongo-service');
