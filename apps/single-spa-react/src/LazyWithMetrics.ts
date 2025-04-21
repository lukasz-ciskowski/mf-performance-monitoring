import { faro } from '@grafana/faro-react';
import React from 'react';

type LazyImport<T> = () => Promise<{ default: React.ComponentType<T> }>;

export function lazyWithMetrics<T>(importFunc: LazyImport<T>, componentName: string) {
    return React.lazy(async () => {
        const start = performance.now();

        const module = await importFunc();

        const end = performance.now();
        const duration = end - start;

        sendLoadMetric(componentName, duration);

        return module;
    });
}

function sendLoadMetric(name: string, duration: number) {
    faro.api.pushMeasurement(
        {
            type: 'lazy_load',
            values: {
                duration,
            },
            context: {
                component: name,
            },
        },
        {
            skipDedupe: true,
            timestampOverwriteMs: 0,
            context: {
                component: name,
            },
            spanContext: {
                traceId: 'traceId',
                spanId: 'spanId',
            },
        },
    );
}
